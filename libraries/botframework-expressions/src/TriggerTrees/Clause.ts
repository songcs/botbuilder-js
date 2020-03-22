// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// using System.Collections.Generic;
// using System.Linq;
// using System.Runtime.Serialization;
// using System.Text;
// using Microsoft.Bot.Expressions;

import { Expression } from '../expression';
import { ExpressionType } from '../../src/expressionType';
import { RelationshipType } from '../../src/TriggerTrees/RelationshipType';
import { IPredicateComparer } from './IOptimizer';
import { TriggerTree } from './TriggerTree';

export class Clause extends Expression {

    // These are the ignored predicates
    public ignored: Expression;

    public anyBindings: Map<string, string> = new Map<string, string>();

    public constructor(fromClauseOrExpressionOrChildren: Clause | Expression | Expression[]) {
        super(ExpressionType.And, undefined)
        if (fromClauseOrExpressionOrChildren instanceof Clause) {
            //This gets used a lot of places but they can't seem to see it in the functions
            this.children = [...fromClauseOrExpressionOrChildren.children];
            for (let [key, value] of fromClauseOrExpressionOrChildren.anyBindings) {
                this.anyBindings.set(key, value);
            }
        } else if (fromClauseOrExpressionOrChildren instanceof Expression) {
            super(ExpressionType.And, undefined, fromClauseOrExpressionOrChildren as Expression);
        } else if (fromClauseOrExpressionOrChildren instanceof Array) {
            super(ExpressionType.And, undefined, ...fromClauseOrExpressionOrChildren);
        } else {
            super(ExpressionType.And, undefined);
        }
    }



    public subsumed: boolean = false;

    public toString(): string {
        return this.indentedToString();
    }

    public indentedToString(indent: number = 0): string {

        let builder = '';
        builder += ' '.repeat(indent);
        if (this.subsumed) {
            builder += '*';
        }

        builder += '(';
        var first = true;
        for (let child of this.children) {
            if (first) {
                first = false;
            }
            else {
                builder += ' && ';
            }

            builder += child.toString();
        }

        builder += ')';
        if (this.ignored != null) {
            builder += ' ignored(';
            builder += this.ignored.toString();
            builder += ')';
        }

        for (var [key, value] of this.anyBindings) {
            builder += ` ${key}->${value}`;
        }
        return builder;
    }
    public ClauseRelationship(other: Clause, comparers: Map<string, IPredicateComparer>): RelationshipType {
        var soFar = RelationshipType.Incomparable;
        var shorter: Clause = this;
        var shorterCount = shorter.children.length;
        var longer = other;
        var longerCount = longer.children.length;
        var swapped = false;
        if (longerCount < shorterCount) {
            longer = this;
            shorter = other;
            var tmp = longerCount;
            longerCount = shorterCount;
            shorterCount = tmp;
            swapped = true;
        }

        if (shorterCount == 0) {
            if (longerCount == 0) {
                soFar = RelationshipType.Equal;
            }
            else {
                soFar = RelationshipType.Generalizes;
            }
        }
        else {
            // If every one of shorter predicates is equal or superset of one in longer, then shorter is a superset of longer
            for (let shortPredicate of shorter.children) {
                var shorterRel = RelationshipType.Incomparable;
                for (let longPredicate of longer.children) {
                    shorterRel = this.ExpressionRelationship(shortPredicate, longPredicate, comparers);
                    if (shorterRel != RelationshipType.Incomparable) {
                        // Found related predicates
                        break;
                    }
                }

                if (shorterRel == RelationshipType.Incomparable) {
                    // Predicate in shorter is incomparable so done
                    soFar = RelationshipType.Incomparable;
                    break;
                }
                else {
                    if (soFar == RelationshipType.Incomparable) {
                        soFar = shorterRel;
                    }

                    if (soFar == RelationshipType.Equal) {
                        if (shorterRel == RelationshipType.Generalizes
                            || (shorterRel == RelationshipType.Specializes && shorterCount == longerCount)
                            || shorterRel == RelationshipType.Equal) {
                            soFar = shorterRel;
                        }
                        else {
                            break;
                        }
                    }
                    else if (soFar != shorterRel) {
                        // Not continued with sub/super so incomparable
                        break;
                    }
                }
            }

            if (shorterCount != longerCount) {
                switch (soFar) {
                    case RelationshipType.Equal:
                    case RelationshipType.Generalizes: soFar = RelationshipType.Generalizes; break;
                    default: soFar = RelationshipType.Incomparable; break;
                }
            }

            soFar = this.BindingsRelationship(soFar, shorter, longer);
        }

        return swapped ? this.Swap(soFar, true) : soFar;
    }

    public Matches(clause: Clause, memory: object): boolean {
        var matched = false;
        //Deep equals is weird in javascript since everything is a reference.
        if (clause.deepEquals(this)) {
            matched = true;
            if (this.ignored !== null) {
                var { value, error } = this.ignored.tryEvaluate(memory);
                matched = error === null && value;
            }
        }

        return matched;
    }

    public SplitIgnores(): void {
        var children: Expression[] = [];
        var ignores: Expression[] = [];
        for (let child of children) {
            if (child.type == TriggerTree.Ignore) {
                ignores.push(child.children[0]);
            }
            else {
                children.push(child);
            }

            //Why? It is already an array?
            // children = children.toArray();
        }

        if (ignores.length > 0) {
            this.ignored = Expression.andExpression(...ignores);
        }
    }

    public BindingsRelationship(soFar: RelationshipType, shorterClause: Clause, longerClause: Clause): RelationshipType {
        if (soFar == RelationshipType.Equal) {
            var swapped = false;
            var shorter = shorterClause.anyBindings;
            var longer = longerClause.anyBindings;
            if (shorterClause.anyBindings.size > longerClause.anyBindings.size) {
                shorter = longerClause.anyBindings;
                longer = shorterClause.anyBindings;
                swapped = true;
            }

            for (let shortBinding of shorter) {
                var found = false;
                for (let longBinding of longer) {
                    if (shortBinding.Key == longBinding.Key && shortBinding.Value == longBinding.Value) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    soFar = RelationshipType.Incomparable;
                    break;
                }
            }

            if (soFar == RelationshipType.Equal && shorter.size < longer.size) {
                soFar = RelationshipType.Specializes;
            }

            soFar = this.Swap(soFar, swapped);
        }

        return soFar;
    }

    public Swap(soFar: RelationshipType, swapped: boolean): RelationshipType {
        if (swapped) {
            switch (soFar) {
                case RelationshipType.Specializes: soFar = RelationshipType.Generalizes; break;
                case RelationshipType.Generalizes: soFar = RelationshipType.Specializes; break;
            }
        }

        return soFar;
    }

    public ExpressionRelationship(expr: Expression, other: Expression, comparers: Map<string, IPredicateComparer>): RelationshipType {
        var relationship = RelationshipType.Incomparable;
        var root = expr;
        var rootOther = other;
        if (expr.type == ExpressionType.Not && other.type == ExpressionType.Not) {
            root = expr.children[0];
            rootOther = other.children[0];
        }

        let comparer: IPredicateComparer = null;
        if (root.type == other.type) {
            comparers.TryGetValue(root.type, comparer);
        }

        if (comparer != null) {
            relationship = comparer.Relationship(root, rootOther);
        }
        else {
            relationship = expr.deepEquals(other) ? RelationshipType.Equal : RelationshipType.Incomparable;
        }

        return relationship;
    }
}
