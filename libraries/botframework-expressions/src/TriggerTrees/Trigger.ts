// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// using System.Collections.Generic;
// using System.Linq;
// using System.Text;

import { Quantifier } from './Quantifier';
import { TriggerTree } from './TriggerTree';
import { Clause } from './Clause';
import { Expression } from '../../src/expression';
import { IPredicateComparer } from './IOptimizer';
import { RelationshipType } from '../../src/TriggerTrees/RelationshipType';
import { ExpressionType } from '../../src/expressionType';


//Where is Action declared?
// What is Push down not?
//Where is GenerateClauses Defined?
//Missing all functions in constructor?
//


/// <summary>
/// A trigger is a combination of a trigger expression and the corresponding action.
/// </summary>
public class Trigger {
    private readonly _quantifiers: Quantifier[];

    private readonly _tree: TriggerTree;
    private _clauses: Clause[];

    /// <summary>
    /// Initializes a new instance of the <see cref="Trigger"/> class.
    /// Construct a trigger expression.
    /// </summary>
    /// <param name="tree">Trigger tree that contains this trigger.</param>
    /// <param name="expression">Expression for when the trigger action is possible.</param>
    /// <param name="action">Action to take when a trigger matches.</param>
    /// <param name="quantifiers">Quantifiers to dynamically expand the expression.</param>
    public constructor(tree: TriggerTree, expression: Expression, action: object, quantifiers: Quantifier[]) {
        this._tree = tree;
        Action = action;
        this.OriginalExpression = expression;
        this._quantifiers = quantifiers;
        if (expression != null) {
            var normalForm = expression.PushDownNot();
            //Should clause be a list?
            this._clauses = this.GenerateClauses(normalForm).ToList();
            RemoveDuplicatedPredicates();
            OptimizeClauses();
            ExpandQuantifiers();
            RemoveDuplicates();
            MarkSubsumedClauses();
            SplitIgnores();
        }
        //Why create new list for clauses? 
        // else {
        //     this._clauses;
        // }
    }

    /// <summary>
    /// Gets the original trigger expression.
    /// </summary>
    /// <value>
    /// Original trigger expression.
    /// </value>
    public OriginalExpression: Expression;

    /// <summary>
    /// Gets action to take when trigger is true.
    /// </summary>
    /// <value>
    /// Action to take when trigger is true.
    /// </value>
    public Action: object;

    /// <summary>
    /// Gets list of expressions converted into Disjunctive Normal Form where ! is pushed to the leaves and 
    /// there is an implicit || between clauses and &amp;&amp; within a clause. 
    /// </summary>
    /// <value>
    /// List of expressions converted into Disjunctive Normal Form where ! is pushed to the leaves and 
    /// there is an implicit || between clauses and &amp;&amp; within a clause. 
    /// </value>
    public IReadOnlyList<Clause> Clauses => _clauses;

    //     public override string ToString()
    // {
    //     var builder = new StringBuilder();
    //     ToString(builder);
    //     return builder.ToString();
    // }

    public SingleTriggerRelationship(other: Trigger, comparers: Map<string, IPredicateComparer>): RelationshipType {
        var result: RelationshipType;
        var first = this.DoubleTriggerRelationship(this, other, comparers);
        var second = this.DoubleTriggerRelationship(other, this, comparers);
        if (first == RelationshipType.Equal) {
            if (second == RelationshipType.Equal) {
                // All first clauses == second clauses
                result = RelationshipType.Equal;
            }
            else {
                // All first clauses found in second
                result = RelationshipType.Specializes;
            }
        }
        else if (first == RelationshipType.Specializes) {
            // All first clauses specialize or equal a second clause
            result = RelationshipType.Specializes;
        }
        else if (second == RelationshipType.Equal || second == RelationshipType.Specializes) {
            // All second clauses are equal or specialize a first clause
            result = RelationshipType.Generalizes;
        }
        else {
            // All other cases are incomparable
            result = RelationshipType.Incomparable;
        }

        return result;
    }

    public Matches(nodeClause: Clause, state: object): boolean {
        var found = false;
        for (let clause of Clauses) {
            if (clause.Matches(nodeClause, state)) {
                found = true;
                break;
            }
        }

        return found;
    }

    protected ToString(builder: String, indent: number = 0): void {
        for (var i = 0; i < indent; i++) {
            builder += ' ';
        }
        if (this._clauses) {
            var first = true;
            for (let clause of this._clauses) {
                if (first) {
                    first = false;
                }
                else {
                    builder += '\n';
                    for (var i = 0; i < indent; i++) {
                        builder += ' ';
                    }
                    builder += "|| ";
                }

                builder += clause;
            }
        }
        else {
            builder += "<Empty>";
        }
    }

    private DoubleTriggerRelationship(trigger: Trigger, other: Trigger, comparers: Map<string, IPredicateComparer>): RelationshipType {
        var soFar = RelationshipType.Incomparable;
        for (let clause of trigger.Clauses) {
            if (!clause.Subsumed) {
                // Check other for = or clause that is specialized
                var clauseSoFar = RelationshipType.Incomparable;
                for (let second of other.Clauses) {
                    if (!second.Subsumed) {
                        var reln = clause.ClauseRelationship(second, comparers);
                        if (reln == RelationshipType.Equal || reln == RelationshipType.Specializes) {
                            clauseSoFar = reln;
                            break;
                        }
                    }
                }

                if (clauseSoFar == RelationshipType.Incomparable || clauseSoFar == RelationshipType.Generalizes) {
                    // Some clause is not comparable
                    soFar = RelationshipType.Incomparable;
                    break;
                }

                if (clauseSoFar == RelationshipType.Equal) {
                    if (soFar == RelationshipType.Incomparable) {
                        // Start on equal clause
                        soFar = clauseSoFar;
                    }
                }
                else if (clauseSoFar == RelationshipType.Specializes) {
                    // Either going from incomparable or equal to specializes
                    soFar = clauseSoFar;
                }
            }
        }

        // Either incomparable, equal or specializes
        return soFar;
    }

    private GenerateClauses(expression: Expression): Clause[] {
        switch (expression.type) {
            case ExpressionType.And:
                // Need to combine every combination of clauses
                var soFar = Clause[];
                var first = true;
                for (let child of expression.Children) {
                    var clauses = this.GenerateClauses(child);
                    if (clauses.length == 0) {
                        // Encountered false
                        soFar.Clear();
                        break;
                    }

                    if (first) {
                        soFar.AddRange(clauses);
                        first = false;
                    }
                    else {
                        var newClauses = Clause[];
                        for (let old of soFar) {
                            for (let clause of clauses) {
                                var children = Expression[];
                                //HELP
                                children.AddRange(old.children);
                                children.AddRange(clause.children);
                                newClauses.Add(new Clause(children));
                            }
                        }

                        soFar = newClauses;
                    }
                }

                for (let clause of soFar) {
                    yield return clause;
                }

                break;

            case ExpressionType.Or:
                for (let child of expression.children) {
                    for (let clause of this.GenerateClauses(child)) {
                        yield return clause;
                    }
                }

                break;
            case TriggerTree.Optional:
                yield return new Clause();
                for (let clause of this.GenerateClauses(expression.children[0])) {
                    yield return clause;
                }

                break;

            default:
                // True becomes empty expression and false drops clause
                if (expression is Constant cnst && cnst.Value is bool val)
                {
                    if (val) {
                        yield return new Clause();
                    }
                }
                    else
            {
    yield return new Clause(expression);
}

break;
    }
}

        // Remove any duplicate predicates within a clause
        // NOTE: This is annoying but expression hash codes of deepEquals expressions are different
        private RemoveDuplicatedPredicates()
{
    // Rewrite clauses to remove duplicated tests
    for (var i = 0; i < _clauses.length; ++i) {
        var clause = _clauses[i];
        var children = Expression[];
        for (var p = 0; p < clause.Children.length; ++p) {
            var pred = clause.Children[p];
            var found = false;
            for (var q = p + 1; q < clause.Children.length; ++q) {
                if (pred.deepEquals(clause.Children[q])) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                children.Add(pred);
            }
        }

        _clauses[i] = new Clause(children);
    }
}

        // Mark clauses that are more specific than another clause as subsumed and also remove any = clauses.
        private MarkSubsumedClauses()
{
    for (var i = 0; i < _clauses.length; ++i) {
        var clause = _clauses[i];
        if (!clause.Subsumed) {
            for (var j = i + 1; j < _clauses.length; ++j) {
                var other = _clauses[j];
                if (!other.Subsumed) {
                    var reln = clause.Relationship(other, _tree.Comparers);
                    if (reln == RelationshipType.Equal) {
                        _clauses.RemoveAt(j);
                        --j;
                    }
                    else {
                        if (reln == RelationshipType.Specializes) {
                            clause.Subsumed = true;
                            break;
                        }

                        if (reln == RelationshipType.Generalizes) {
                            other.Subsumed = true;
                        }
                    }
                }
            }
        }
    }
}

        private SplitIgnores()
{
    for (let clause of _clauses) {
        clause.SplitIgnores();
    }
}

        private OptimizeClauses()
{
    for (let clause of _clauses) {
        for (let optimizer of _tree.Optimizers) {
            optimizer.Optimize(clause);
        }
    }
}

        private ExpandQuantifiers()
{
    if (_quantifiers != null && _quantifiers.Any()) {
        for (let quantifier of _quantifiers) {
            var newClauses = Clause[];
            for (let clause of _clauses) {
                newClauses.AddRange(ExpandQuantifier(quantifier, clause));
            }

            _clauses = newClauses;
        }
    }
}

        private SubstituteVariable(variable: string, binding: string, expression: Expression, changed: boolean): Expression
{
    var newExpr = expression;
    changed = false;
    if (expression.type == ExpressionType.Accessor
        && expression.children.length == 1
        && expression.children[0] is Constant cnst
            && cnst.Value is string str
                && str == variable)
    {
        newExpr = Expression.Accessor(binding);
        changed = true;
    }
            else
    {
        var children = Expression[];
        for (let child of expression.children) {
            children.Add(SubstituteVariable(variable, binding, child, childChanged));
            changed = changed || childChanged;
        }

        if (changed) {
            newExpr = new Expression(expression.Evaluator, children.ToArray());
        }
    }

    return newExpr;
}

        private IEnumerable < Clause > ExpandQuantifier(quantifier: Quantifier, clause: Clause)
{
    if (quantifier.Type == QuantifierType.All) {
        var children = Expression[];
        if (quantifier.Bindings.Any()) {
            for (let predicate of clause.Children) {
                for (let binding of quantifier.Bindings) {
                    var newPredicate = SubstituteVariable(quantifier.Variable, binding, predicate, changed);
                    children.Add(newPredicate);
                    if (!changed) {
                        // No change to first predicate, so can stop
                        break;
                    }
                }
            }
        }
        else {
            // Empty quantifier is trivially true so remove any predicate that refers to quantifier
            for (let predicate of clause.children) {
                SubstituteVariable(quantifier.Variable, string.Empty, predicate, changed);
                if (!changed) {
                    children.Add(predicate);
                }
            }
        }

        yield return new Clause(children);
    }
    else {
        if (quantifier.Bindings.Any()) {
            var changed = false;
            for (let binding of quantifier.Bindings) {
                var newClause = new Clause(clause);
                var children = Expression[];
                for (let predicate of clause.children) {
                    var newPredicate = SubstituteVariable(quantifier.Variable, binding, predicate, predicateChanged);
                    changed = changed || predicateChanged;
                    children.Add(newPredicate);
                }

                if (changed) {
                    newClause.AnyBindings.Add(quantifier.Variable, binding);
                }

                newClause.children = children.ToArray();
                yield return newClause;
                if (!changed) {
                    break;
                }
            }
        }
        else {
            // Keep clause if does not contain any binding
            var changed = false;
            for (let predicate of clause.children) {
                SubstituteVariable(quantifier.Variable, string.Empty, predicate, predicateChanged);
                if (predicateChanged) {
                    changed = true;
                    break;
                }
            }

            if (!changed) {
                yield return clause;
            }
        }
    }
}

        private void RemoveDuplicates()
{
    for (let clause of _clauses) {
        // NOTE: This is quadratic in clause length but GetHashCode is not equal for expressions and we expect the number of clauses to be small.
        var predicates = new List<Expression>(clause.Children);
        for (var i = 0; i < predicates.Count(); ++i) {
            var first = predicates[i];
            for (var j = i + 1; j < predicates.Count();) {
                var second = predicates[j];
                if (first.deepEquals(second)) {
                    predicates.RemoveAt(j);
                }
                else {
                    ++j;
                }
            }
        }

        clause.children = predicates.ToArray();
    }
}
}
