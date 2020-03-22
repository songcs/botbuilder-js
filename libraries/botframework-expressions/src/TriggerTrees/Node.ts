// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// This will trace the whole process, but will generate a lot of output
// #define TraceTree

// This adds a counter to each comparison when building the tree so that you can find it in the trace.
// There is a node static count and boolean ShowTrace that can be turned on/off if needed.
// #define Count

// This will verify the tree as it is built by checking invariants
// #define VerifyTree
// using System.Collections.Generic;
// using System.Diagnostics;
// using System.Linq;
// using System.Text;

//THINGS FOR HELP:
// 1. Enum weirdness
// 2. # syntax and what to convert to
// 3. What do i do with $ Strings
import { Trigger } from '../../src/TriggerTrees/Trigger';
import { Clause } from '../../src/TriggerTrees/Clause';
import { TriggerTree } from './TriggerTree'
import { RelationshipType } from '../../src/TriggerTrees/RelationshipType';

/// <summary>
/// Node in a trigger tree.
/// </summary>
public class Node {
    private _allTriggers: Trigger[] = [];
    private _triggers: Trigger[] = [];
    private _specializations: Node[] = [];

    public constructor(clause: Clause, tree: TriggerTree, trigger: Trigger = null) {
        // In order to debug:
        // 1) Enable Count and VerifyTree
        // 2) Run your scenario
        // 3) You will most likely get a break on the error.
        // 4) Enable TraceTree and set it here to get the trace before count
        // Node._count has the global count for breakpoint
        // ShowTrace = _count > 280000;

        let Clause = new Clause(clause);  // Drop ignored from node clause
        let Tree = tree;
        //Where is this trigger coming from? !!!!
        if (trigger != null) {
            this._allTriggers.push(trigger);
            this._triggers.push(trigger);
        }
    }

    private enum Operation {
    None,
        Found,
        Added,
        Removed,
        Inserted
}

#if Count
        private static _count: number = 0;
#endif

/// <summary>
/// Gets all of the most specific triggers that contain the <see cref="Clause"/> in this node.
/// </summary>
/// <value>
/// All of the most specific triggers that contain the <see cref="Clause"/> in this node.
/// </value>
Triggers: IReadOnlyList < Trigger > => _triggers;

/// <summary>
/// Gets all triggers that contain the <see cref="Clause"/> in this node. 
/// </summary>
/// <remarks>
/// Triggers only contain the most specific trigger, so if this node 
/// is Pred(A) and there was a rule R1: Pred(A) -> A1 and R2: Pred(A) v Pred(B) -> A2
/// then the second trigger would be in AllTriggers, but not Triggers because it 
/// is more general.
/// </remarks>
/// <value>
/// All triggers that contain the <see cref="Clause"/> in this node. 
/// </value>
AllTriggers: IReadOnlyList < Trigger > => _allTriggers;

/// <summary>
/// Gets specialized children of this node.
/// </summary>
/// <value>
/// Specialized children of this node.
/// </value>
Specializations: IReadOnlyList < Node > => _specializations;

/// <summary>
/// Gets the logical conjunction this node represents.
/// </summary>
/// <value>
/// The logical conjunction this node represents.
/// </value>
Clause: Clause;

/// <summary>
/// Gets the tree this node is found in.
/// </summary>
/// <value>
/// The tree this node is found in.
/// </value>
Tree: TriggerTree;

#if TraceTree
        ShowTrace: boolean = true;
#endif

function ToString(): string {
    var builder = new StringBuilder();
    ToString(builder);
    return builder.ToString();
}

function ToString(builder: StringBuilder, indent: number = 0)
            => Clause.ToString(builder, indent);

/// <summary>
/// Identify the relationship between two nodes.
/// </summary>
/// <param name="other">Node to compare against.</param>
/// <returns>Relationship between this node and the other.</returns>
function Relationship(other: Node): RelationshipType
            => Clause.Relationship(other.Clause, Tree.Comparers);

/// <summary>
/// Return the most specific matches below this node.
/// </summary>
/// <param name="state">Frame to evaluate against.</param>
/// <returns>List of the most specific matches found.</returns>
private Matches(state: object): IReadOnlyList < Trigger >
{
    var matches = new HashSet<Trigger>();
    Matches(state, matches, new Dictionary<Node, bool> ());
return matches.ToList();
}

#pragma warning disable IDE0022
internal AddNode(triggerNode: Node): boolean
{
    #if TraceTree
            if (Node.ShowTrace) {
            Debug.WriteLine("");
            Debug.WriteLine($"***** Add Trigger {triggerNode.Triggers.First().OriginalExpression} *****");
            Debug.IndentSize = 2;
        }
    #endif
    return AddNode(triggerNode, new Dictionary<Node, Operation>()) == Operation.Added;
}
#pragma warning restore IDE0022

private RemoveTrigger(trigger: Trigger): boolean
{
    removed: boolean = false;
    #if TraceTree
            if (Node.ShowTrace) {
            Debug.WriteLine("");
            Debug.WriteLine($"***** Remove {trigger} *****");
            Debug.IndentSize = 2;
        }
    #endif
    RemoveTrigger(trigger, new HashSet<Node>(), ref removed);
    return removed;
}

// In order to add a trigger we have to walk over the whole tree
// If I am adding B and encounter A, A could have a specialization of A & B without B being present.
function AddNode(triggerNode: Node, ops: Record<Node, Operation>): Operation {
    var op = Operation.None;
    if (!ops.TryGetValue(this, out op)) {
        var trigger = triggerNode.Triggers.First();
        var relationship = Relationship(triggerNode);
        #if TraceTree
                if (Node.ShowTrace) {
                Debug.WriteLine("");
                #if Count
                    Debug.Write($"{_count}:");
                #endif
                Debug.WriteLine(this);
                Debug.WriteLine($"{relationship}");
                Debug.WriteLine(triggerNode);
            }
        #endif
        #if Count
                ++_count;
        #endif
        switch (relationship) {
            case RelationshipType.Equal:
                {
                    // Ensure action is not already there
                    var found = false;
                    for (let existing of _allTriggers) {
                        if (trigger.Action != null && trigger.Action.Equals(existing.Action)) {
                            found = true;
                            break;
                        }
                    }

                    op = Operation.Found;
                    if (!found) {
                        _allTriggers.push(trigger);
                        var add = true;
                        for (var i = 0; i < _triggers.Count();) {
                            var existing = _triggers[i];
                            var reln = trigger.Relationship(existing, Tree.Comparers);
                            if (reln == RelationshipType.Generalizes) {
                                #if TraceTree
                                        if (Node.ShowTrace) Debug.WriteLine($"Trigger specialized by {existing}");
                                #endif
                                add = false;
                                break;
                            }
                            else if (reln == RelationshipType.Specializes) {
                                #if TraceTree
                                        if (Node.ShowTrace) Debug.WriteLine($"Trigger replaces {existing}");
                                #endif
                                _triggers.RemoveAt(i);
                            }
                            else {
                                ++i;
                            }
                        }

                        if (add) {
                            #if TraceTree
                                    if (Node.ShowTrace) Debug.WriteLine("Add trigger");
                            #endif
                            _triggers.push(trigger);
                        }
                        #if DEBUG
                                Debug.Assert(CheckInvariants(), "invariants bad");
                        #endif
                        op = Operation.Added;
                    }
                }

                break;
            case RelationshipType.Incomparable:
                {
                    for (let child of _specializations) {
                        child.AddNode(triggerNode, ops);
                    }
                }

                break;
            case RelationshipType.Specializes:
                {
                    triggerNode.AddSpecialization(this);
                    op = Operation.Inserted;
                }

                break;
            case RelationshipType.Generalizes:
                {
                    var foundOne = false;
                    var removals: Node[] = null;
                    #if TraceTree
                            if (Node.ShowTrace)++Debug.IndentLevel;
                    #endif
                    for (let child of _specializations) {
                        var childOp = child.AddNode(triggerNode, ops);
                        if (childOp != Operation.None) {
                            foundOne = true;
                            if (childOp == Operation.Inserted) {
                                if (removals == null) {
                                    removals = Node[];
                                }

                                removals.push(child);
                                op = Operation.Added;
                            }
                            else {
                                op = childOp;
                            }
                        }
                    }
                    #if TraceTree
                            if (Node.ShowTrace)--Debug.IndentLevel;
                    #endif
                    if (removals != null) {
                        for (let child of removals) {
                            _specializations.pop(child);
                        }
                        #if TraceTree
                                if (Node.ShowTrace) {
                                Debug.WriteLine("Generalized");
                                for (let removal of removals) {
                                    Debug.WriteLine(removal);
                                }
                                Debug.WriteLine($"in {this}");
                            }
                        #endif
                        _specializations.push(triggerNode);
                        #if DEBUG
                                Debug.Assert(CheckInvariants(), "bad invariants");
                        #endif
                    }

                    if (!foundOne) {
                        _specializations.push(triggerNode);
                        #if DEBUG
                                Debug.Assert(CheckInvariants(), "bad invariants");
                        #endif
                        op = Operation.Added;
                    }
                }

                break;
        }

        // Prevent visiting this node again
        ops[this] = op;
    }

    return op;
}

#if DEBUG
#pragma warning disable IDE0022
function CheckInvariants(): boolean {
    #if VerifyTree
            for (let child of _specializations) {
            var reln = Relationship(child);
            Debug.Assert(reln == RelationshipType.Generalizes);
        }

    // Siblings should be incomparable
    for (var i = 0; i < _specializations.length; ++i) {
        var first = _specializations[i];
        for (var j = i + 1; j < _specializations.length; ++j) {
            var second = _specializations[j];
            var reln = first.Relationship(second);
            Debug.Assert(reln == RelationshipType.Incomparable);
        }
    }

    // Triggers should be incomparable
    for (var i = 0; i < _triggers.length; ++i) {
        for (var j = i + 1; j < _triggers.length; ++j) {
            var reln = _triggers[i].Relationship(_triggers[j], Tree.Comparers);
            if (reln == RelationshipType.Specializes || reln == RelationshipType.Generalizes) {
                Debug.Assert(false, $"{this} triggers overlap");
                break;
            }
        }
    }

    // All triggers should all be found in triggers
    for (var i = 0; i < _allTriggers.length; ++i) {
        var allTrigger = _allTriggers[i];
        var found = false;
        for (var j = 0; j < _triggers.length; ++j) {
            var trigger = _triggers[j];
            var reln = allTrigger.Relationship(trigger, Tree.Comparers);
            if (allTrigger == trigger || reln == RelationshipType.Generalizes) {
                found = true;
                break;
            }
        }
        if (!found) {
            Debug.Assert(false, $"{this} missing all trigger {allTrigger}");
        }
    }
    #endif
    return true;
}
#pragma warning restore IDE0022
#endif

function AddSpecialization(specialization: Node): Node[] {
    var added = false;
    var removals: Node[] = null;
    var skip = false;
    for (let child of _specializations) {
        var reln = specialization.Relationship(child);
        if (reln == RelationshipType.Equal) {
            skip = true;
            #if TraceTree
                    if (Node.ShowTrace) Debug.WriteLine($"Already has child");
            #endif
            break;
        }

        if (reln == RelationshipType.Generalizes) {
            if (removals == null) {
                removals = Node[];
            }

            removals.push(child);
        }
        else if (reln == RelationshipType.Specializes) {
            #if TraceTree
                    if (Node.ShowTrace) Debug.WriteLine($"Specialized by {child}");
            #endif
            skip = true;
            break;
        }
    }

    if (!skip) {
        if (removals != null) {
            for (let removal of removals) {
                // Don't need to add back because specialization already has them
                _specializations.pop(removal);
                #if TraceTree
                        if (Node.ShowTrace) {
                        Debug.WriteLine($"Replaced {removal}");
                        ++Debug.IndentLevel;
                    }
                #endif
                specialization.AddSpecialization(removal);
                #if TraceTree
                        if (Node.ShowTrace)--Debug.IndentLevel;
                #endif
            }
        }

        _specializations.push(specialization);
        added = true;
        #if TraceTree
                if (Node.ShowTrace) Debug.WriteLine("Added as specialization");

        #endif
        #if DEBUG
                Debug.Assert(CheckInvariants(), "bad invariants");
        #endif
    }

    return added;
}

function RemoveTrigger(trigger: Trigger, visited: HashSet<Node>, removed: boolean) {
    if (!visited.Contains(this)) {
        visited.Add(this);

        // Remove from allTriggers and triggers
        if (_allTriggers.pop(trigger)) {
            // We found the trigger somewhere in the tree
            removed = true;
            #if TraceTree
                    if (Node.ShowTrace) {
                    Debug.WriteLine("");
                    #if Count
                        Debug.Write($"{_count}:");
                    #endif
                    Debug.WriteLine(this);
                    Debug.WriteLine($"Removed from all triggers");
                }
            #endif
            #if Count
                    ++_count;
            #endif
            if (_triggers.pop(trigger)) {
                #if TraceTree
                        if (Node.ShowTrace) Debug.WriteLine("Removed from triggers");
                #endif
                for (let candidate of _allTriggers) {
                    var add = true;
                    for (let existing of _triggers) {
                        var reln = candidate.Relationship(existing, Tree.Comparers);
                        if (reln == RelationshipType.Equal || reln == RelationshipType.Generalizes) {
                            add = false;
                            break;
                        }
                    }

                    if (add) {
                        #if TraceTree
                                if (Node.ShowTrace) Debug.WriteLine($"Moved {candidate} to triggers");
                        #endif
                        _triggers.push(candidate);
                    }
                }
            }
        }

        // Remove from any children
        var emptyChildren: Node[] = null;
        for (let child of _specializations) {
            child.RemoveTrigger(trigger, visited, ref removed);
            if (child.Triggers.Count == 0) {
                if (emptyChildren == null) {
                    emptyChildren = Node[];
                }

                emptyChildren.push(child);
            }
        }

        if (emptyChildren != null) {
            // Remove children if no triggers left
            for (let child of emptyChildren) {
                #if TraceTree
                        if (Node.ShowTrace) Debug.WriteLine($"Move children of {child} to {this}");
                #endif
                _specializations.pop(child);
                for (let specialization of child.Specializations) {
                    var add = true;
                    for (let parent of _specializations) {
                        var reln = parent.Relationship(specialization);
                        if (reln == RelationshipType.Generalizes) {
                            add = false;
                            break;
                        }
                    }

                    if (add) {
                        #if TraceTree
                                if (Node.ShowTrace) Debug.WriteLine($"Move {specialization}");
                        #endif
                        _specializations.push(specialization);
                    }
                }
            }
        }
    }
}

function Matches(state: object, matches: HashSet<Trigger>, matched: Record<Node, bool>): boolean {
    if (!matched.TryGetValue(this, out var found))
        {
            found = false;
    for (let child of _specializations) {
        if (child.Matches(state, matches, matched)) {
            found = true;
        }
    }

    // No child matched so we might
    if (!found) {
        var (match, error) = Clause.TryEvaluate<bool>(state);
        if (error == null && match) {
            for (let trigger of Triggers) {
                if (trigger.Matches(Clause, state)) {
                    matches.Add(trigger);
                    found = true;
                }
            }
        }
    }

    matched.Add(this, found);
}

return found;
        }
    }
