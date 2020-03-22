// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as expr from '../../src/expression';
import { Quantifier } from '../src/TriggerTrees/Quantifier';
import { Comparison } from './Comparison';

export class ExpressionInfo {
    public Expression: expr.Expression;
    public Bindings: Record<string, Comparison>;
    public Quantifiers: Quantifier[];
    
    public constructor(expression: expr.Expression) 
    public constructor(expression: expr.Expression, bindings: Record<string, Comparison>, quantifiers: Quantifier[])
    public constructor(expression: expr.Expression, nameOrbindings?: string | Record<string, Comparison>, valueOrquantifiers?: object | Quantifier[] = null, type: string)
    {
        this.Expression = expression;
        if (valueOrquantifiers) {
            if (typeof valueOrquantifiers === 'object') {
                this.Bindings.Add(name, new Comparison(type, valueOrquantifiers as object));
            }
        }
        this.Bindings = bindings;
        if (quantifiers != null)
        {
            Quantifiers = quantifiers;
        }
    }

    public toString(): string { return expr.Expression.toString(); }
}