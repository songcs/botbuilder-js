// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <summary>
/// Type of quantifier for expanding trigger expressions.
/// </summary>
public enum QuantifierType {
    /// <summary>
    /// Within a clause, duplicate any predicate with variable for each possible binding.
    /// </summary>
    All,

    /// <summary>
    /// Create a new clause for each possible binding of variable.
    /// </summary>
    Any
}

/// <summary>
/// Quantifier for allowing runtime expansion of expressions.
/// </summary>
export class Quantifier {
    /// <summary>
    /// Initializes a new instance of the <see cref="Quantifier"/> class.
    /// </summary>
    /// <param name="variable">Name of variable to replace.</param>
    /// <param name="type">Type of quantifier.</param>
    /// <param name="bindings">Possible bindings for variable.</param>
    public Quantifier(variable: string, type: QuantifierType, bindings: string[]) {
        this.Variable = variable;
        this.Type = type;
        this.Bindings = bindings;
    }

    /// <summary>
    /// Gets name of variable that will be replaced.
    /// </summary>
    /// <value>
    /// Name of variable that will be replaced.
    /// </value>
    Variable: string;

    /// <summary>
    /// Gets type of quantifier.
    /// </summary>
    /// <value>
    /// Type of quantifier.
    /// </value>
    public Type: QuantifierType

    /// <summary>
    /// Gets possible bindings for quantifier.
    /// </summary>
    /// <value>
    /// Possible bindings for quantifier.
    /// </value>
    public Bindings: string[]

    public ToString(): string {
        return $"{Type} {Variable} {Bindings.Count()}";
    }
}
