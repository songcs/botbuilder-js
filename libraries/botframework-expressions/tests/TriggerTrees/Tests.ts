// using System.Collections.Generic;
// using System.Linq;
// using Microsoft.Bot.Expressions;
// using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace Microsoft.Bot.Expressions.TriggerTrees.Tests {
    [TestClass]
    public class Tests {
        private readonly _generator: Generator;

        public Tests() {
            _generator = new Generator();
        }

        [TestMethod]
        public void TestRoot() {
            let tree: TriggerTree = new TriggerTree();
            tree.AddTrigger("true", "root");
            let matches = tree.Matches(new Dictionary<string, object>());
            Assert.AreEqual(1, matches.Count());
            Assert.AreEqual("root", matches.First().Action);
        }

        [TestMethod]
        public void TestIgnore() {
            let tree: TriggerTree = new TriggerTree();
            tree.AddTrigger("ignore(!exists(foo)) && exists(blah)", 1);
            tree.AddTrigger("exists(blah) && ignore(!exists(foo2)) && woof == 3", 2);
            tree.AddTrigger("exists(blah) && woof == 3", 3);
            tree.AddTrigger("exists(blah) && woof == 3 && ignore(!exists(foo2))", 2);
            let frame: Dictionary<string, object> = new Dictionary < string, object> { { "blah", 1 }, { "woof", 3 }
        };
            let matches = tree.Matches(frame).ToList();
    Assert.AreEqual(2, matches.Count);
    Assert.AreEqual(2, matches[0].Action);
    Assert.AreEqual(3, matches[1].Action);
}

[TestMethod]
        public void TestOr()
{
    let tree: TriggerTree = new TriggerTree();
    tree.AddTrigger("exists(woof) || exists(blah)", 1);
    tree.AddTrigger("exists(blah)", 2);
    tree.AddTrigger("exists(blah) && exists(foo)", 3);
    let frame: Dictionary<string, object> = new Dictionary < string, object> { { "blah", 1 }, { "woof", 3 }
};
let matches = tree.Matches(frame).ToList();
Assert.AreEqual(2, matches.Count);
Assert.AreEqual(1, matches[0].Action);
Assert.AreEqual(2, matches[1].Action);
        }

[TestMethod]
        public void TestTrueFalse()
{
    let tree: TriggerTree = new TriggerTree();
    tree.AddTrigger("exists(blah) && true", 1);
    tree.AddTrigger("exists(blah) && false", 2);
    tree.AddTrigger("exists(blah)", 3);
    tree.AddTrigger("true", 4);
    tree.AddTrigger("false", 5);
    let memory: Dictionary<string, object> = new Dictionary<string, object>();

    let matches = tree.Matches(memory).ToList();
    Assert.AreEqual(1, matches.Count);
    Assert.AreEqual(4, matches[0].Action);

    memory.Add("blah", 1);
    matches = tree.Matches(memory).ToList();
    Assert.AreEqual(2, matches.Count());
    Assert.AreEqual(1, matches[0].Action);
    Assert.AreEqual(3, matches[1].Action);
}

[TestMethod]
        public void TestTree()
{
    let numPredicates: number = 100;
    let numSingletons: number = 50;
    let numConjunctions: number = 100;
    let numDisjunctions: number = 100;
    let numOptionals: number = 100;
    let numQuantifiers: number = 100;
    let numNots: number = 100;

    let minClause: number = 2;
    let maxClause: number = 4;
    let maxExpansion: number = 3;
    let maxQuantifiers: number = 3;
    let singletons = _generator.GeneratePredicates(numPredicates, "mem");
    let tree: TriggerTree = new TriggerTree();
    let predicates: List<ExpressionInfo> = new List<ExpressionInfo>(singletons);
    let triggers: List<Trigger> = new List<Trigger>();

    // Add singletons
    for (let predicate of singletons.Take(numSingletons)) {
        triggers.Add(tree.AddTrigger(predicate.Expression, predicate.Bindings));
    }

    Assert.AreEqual(numSingletons, tree.TotalTriggers);

    // Add conjunctions and test matches
    let conjunctions = _generator.GenerateConjunctions(predicates, numConjunctions, minClause, maxClause);
    for (let conjunction of conjunctions) {
        let memory: Dictionary<string, object> = new Dictionary<string, object>();
        for (let binding of conjunction.Bindings) {
            memory.Add(binding.Key, binding.Value.Value);
        }

        let trigger = tree.AddTrigger(conjunction.Expression, conjunction.Bindings);
        let matches = tree.Matches(memory);
        triggers.Add(trigger);
        Assert.IsTrue(matches.Count() >= 1);
        let first = matches.First().Clauses.First();
        for (let match of matches) {
            Assert.AreEqual(RelationshipType.Equal, first.Relationship(match.Clauses.First(), tree.Comparers));
        }
    }

    Assert.AreEqual(numSingletons + numConjunctions, tree.TotalTriggers);

    // Add disjunctions
    predicates.AddRange(conjunctions);
    let disjunctions = _generator.GenerateDisjunctions(predicates, numDisjunctions, minClause, maxClause);
    for (let disjunction of disjunctions) {
        triggers.Add(tree.AddTrigger(disjunction.Expression, disjunction.Bindings));
    }

    Assert.AreEqual(numSingletons + numConjunctions + numDisjunctions, tree.TotalTriggers);

    let all: List<ExpressionInfo> = new List<ExpressionInfo>(predicates);
    all.AddRange(disjunctions);

    // Add optionals
    let optionals = _generator.GenerateOptionals(all, numOptionals, minClause, maxClause);
    for (let optional of optionals) {
        triggers.Add(tree.AddTrigger(optional.Expression, optional.Bindings));
    }

    Assert.AreEqual(numSingletons + numConjunctions + numDisjunctions + numOptionals, tree.TotalTriggers);
    all.AddRange(optionals);

    // Add quantifiers
    let quantified = _generator.GenerateQuantfiers(all, numQuantifiers, maxClause, maxExpansion, maxQuantifiers);
    for (let expr of quantified) {
        triggers.Add(tree.AddTrigger(expr.Expression, expr.Bindings, expr.Quantifiers.ToArray()));
    }

    Assert.AreEqual(numSingletons + numConjunctions + numDisjunctions + numOptionals + numQuantifiers, tree.TotalTriggers);
    all.AddRange(quantified);

    let nots = _generator.GenerateNots(all, numNots);
    for (let expr of nots) {
        triggers.Add(tree.AddTrigger(expr.Expression, expr.Bindings, expr.Quantifiers.ToArray()));
    }

    Assert.AreEqual(numSingletons + numConjunctions + numDisjunctions + numOptionals + numQuantifiers + numNots, tree.TotalTriggers);
    all.AddRange(nots);

    VerifyTree(tree);

    // Test matches
    for (let predicate of predicates) {
        let memory: Dictionary<string, object>() = new Dictionary<string, object>();
        for (let binding of predicate.Bindings) {
            memory.Add(binding.Key, binding.Value.Value);
        }

        let matches = tree.Matches(memory).ToList();

        // Clauses in every match must not generalize or specialize other matches
        for (let i = 0; i < matches.Count; ++i) {
            let first = matches[i];
            for (let j = i + 1; j < matches.Count; ++j) {
                let second = matches[j];
                let found = false;
                for (let firstClause of first.Clauses) {
                    let(match, error) = firstClause.TryEvaluate<bool>(memory);
                    if (error == null && match) {
                        foreach(var secondClause in second.Clauses)
                        {
                            bool match2;
                            (match2, error) = firstClause.TryEvaluate<bool>(memory);
                            if (error == null && match2) {
                                let reln = firstClause.Relationship(secondClause, tree.Comparers);
                                if (reln == RelationshipType.Equal || reln == RelationshipType.Incomparable) {
                                    found = true;
                                    break;
                                }
                            }
                        }

                        if (found) {
                            break;
                        }
                    }
                }

                Assert.IsTrue(found);
            }
        }
    }

    // NOTE: This is useful to test tree visualization, but not really a test.
    // tree.GenerateGraph("tree.dot");

    // Delete triggers
    Assert.AreEqual(triggers.Count, tree.TotalTriggers);
    for (let trigger of triggers) {
        tree.RemoveTrigger(trigger);
    }

    Assert.AreEqual(0, tree.TotalTriggers);
    VerifyTree(tree);
}

        private VerifyAddTrigger(tree: TriggerTree, expression: Expression, action: object): Trigger
{
    let trigger = tree.AddTrigger(expression, action);
    VerifyTree(tree);
    return trigger;
}

        private void VerifyTree(TriggerTree tree)
{
    let badNode = tree.VerifyTree();
    Assert.AreEqual(null, badNode);
}
    }
}
