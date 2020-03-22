// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

//#pragma warning disable SA1601 // Partial elements should be documented

// import { System } from "./FIND SYSTEM PATH";
// import { System.Collections.Generic } from "./FIND PATH";
// import { System.Ling } from "./FIND PATH";
// import { System.Text } from "./FIND PATH";
// import { Microsoft.Bot.Expressions } from "./FIND PATH";

namespace Microsoft.Bot.Expressions.TriggerTrees.Tests {
    class Generator {
        private const DoubleEpsilon: number = 0.000001;

        private static Comparisons: string[] = new string[]
        {
        ExpressionType.LessThan,
            ExpressionType.LessThanOrEqual,
            ExpressionType.Equal,

            // TODO: null values are always not equal ExpressionType.NotEqual,
            ExpressionType.GreaterThanOrEqual,
            ExpressionType.GreaterThan
    };

    Rand: Random
        public Generator(seed: number = 0)
    {
        Rand = new Random(seed);
    }

        /* Predicates */

        public GenerateString(length: number): Expression => Expression.ConstantExpression(RandomString(length));

        public RandomString(length: number): string
    {
        //object? OR StringBuilder
        let builder: StringBuilder = new StringBuilder();
        for (let i = 0; i < length; ++i) {
            builder.Append((char)('a' + Rand.Next(26)));
        }

        return builder.ToString();
    }

        public GenerateSimpleComparison(name: string): ExpressionInfo
    {
        expression: Expression = null;
        value: object = null;
        let type: RandomChoice<String> = RandomChoice<string>(Comparisons);
        switch (Rand.Next(2)) {
            case 0:
                {
                    value = Rand.Next();
                    expression = Expression.MakeExpression(
                        type,
                        Expression.Accessor(name),
                        Expression.ConstantExpression(AdjustValue((int)value, type)));
                }

                break;
            case 1:
                {
                    value = Rand.NextDouble();
                    expression = Expression.MakeExpression(
                        type,
                        Expression.Accessor(name),
                        Expression.ConstantExpression(AdjustValue((double)value, type)));
                }

                break;
        }

        return new ExpressionInfo(expression, name, value, type);
    }

        public GenerateHasValueComparison(name: string): ExpressionInfo
    {
        expression: Expression = null;
        value: object = null;
        switch (Rand.Next(3)) {
            case 0:
                expression = Expression.MakeExpression(ExpressionType.Exists, Expression.Accessor(name));
                value = Rand.Next();
                break;
            case 1:
                expression = Expression.MakeExpression(ExpressionType.Exists, Expression.Accessor(name));
                value = Rand.NextDouble();
                break;
            case 2:
                expression = Expression.MakeExpression(ExpressionType.NotEqual, Expression.Accessor(name), Expression.ConstantExpression(null));
                value = RandomString(5);
                break;
        }

        return new ExpressionInfo(expression, name, value, ExpressionType.Not);
    }

        public GeneratePredicates(n: number, nameBase: string): List < ExpressionInfo >
        {
            let expressions: List<ExpressionInfo>() = new List<ExpressionInfo>();
            for(let i = 0; i <n; ++i)
    {
        let name = $"{nameBase}{i}";
        let selection: RandomWeighted = RandomWeighted(new number[] { 1.0, 1.0 });
        switch (selection) {
            case 0: expressions.Add(GenerateSimpleComparison(name)); break;
            case 1: expressions.Add(GenerateHasValueComparison(name)); break;
        }
    }

    return expressions;
}

        public GenerateConjunctions(predicates: List < ExpressionInfo >, numConjunctions: number, minClause: number, maxClause: number): List < ExpressionInfo >
    {
        let conjunctions: List < ExpressionInfo > = new List<ExpressionInfo>();
        for(let i = 0; i <numConjunctions; ++i)
{
    let clauses: number = minClause + Rand.Next(maxClause - minClause);
    let expressions: List<ExpressionInfo> = new List<ExpressionInfo>();
    let used: List<number> = new List<number>();
    for (let j = 0; j < clauses; ++j) {
        choice: number;
        do {
            choice = Rand.Next(predicates.Count);
        }
        while (used.Contains(choice));

        expressions.Add(predicates[choice]);
        used.Add(choice);
    }

    let conjunction: Binary = Binary(ExpressionType.And, expressions, out var bindings);
    conjunctions.Add(new ExpressionInfo(conjunction, bindings));
}

return conjunctions;
        }

        public GenerateDisjunctions(predicates: List < ExpressionInfo >, numDisjunctions: number, minClause: number, maxClause: number): List < ExpressionInfo >
    {
        let disjunctions: List < ExpressionInfo > = new List<ExpressionInfo>();
        for(let i = 0; i <numDisjunctions; ++i)
{
    let clauses: number = minClause + Rand.Next(maxClause - minClause);
    let expressions: List<ExpressionInfo> = new List<ExpressionInfo>();
    let used: List<number> = new List<number>();
    for (var j = 0; j < clauses; ++j) {
        choice: number;
        do {
            choice = Rand.Next(predicates.Count);
        }
        while (used.Contains(choice));
        expressions.Add(predicates[choice]);
        used.Add(choice);
    }

    let disjunction: Binary = Binary(ExpressionType.Or, expressions, out var bindings);
    disjunctions.Add(new ExpressionInfo(disjunction, bindings));
}

return disjunctions;
        }

        public GenerateOptionals(predicates: List < ExpressionInfo >, numOptionals: number, minClause: number, maxClause: number): List < ExpressionInfo >
    {
        let optionals: List < ExpressionInfo > = new List<ExpressionInfo>();
        for(let i = 0; i <numOptionals; ++i)
{
    let clauses: number = minClause + Rand.Next(maxClause - minClause);
    let expressions: List<ExpressionInfo> = new List<ExpressionInfo>();
    let used: List<number> = new List<number>();
    for (let j = 0; j < clauses; ++j) {
        choice: number;
        do {
            choice = Rand.Next(predicates.Count);
        }
        while (used.Contains(choice));

        let predicate = predicates[choice];
        if (j == 0) {
            let optional = Expression.MakeExpression(TriggerTree.LookupFunction(TriggerTree.Optional), predicate.Expression);
            if (Rand.NextDouble() < 0.25) {
                optional = Expression.NotExpression(optional);
            }

            expressions.Add(new ExpressionInfo(optional, predicate.Bindings));
        }
        else {
            expressions.Add(predicate);
        }

        used.Add(choice);
    }

    let conjunction: Binary = Binary(ExpressionType.And, expressions, out var bindings);
    optionals.Add(new ExpressionInfo(conjunction, bindings));
}

return optionals;
        }

        public Binary(
    type: string,
    expressions: IEnumerable < ExpressionInfo >,
    bindings: Dictionary<string, Comparison>): Expression
        {
        bindings = MergeBindings(expressions);
        binaryExpression: Expression = null;
        for(let info of expressions) {
            if (binaryExpression == null) {
                binaryExpression = info.Expression;
            }
            else {
                binaryExpression = Expression.MakeExpression(type, binaryExpression, info.Expression);
            }
        }

            return binaryExpression;
    }

        public Predicates(expressions: IEnumerable<ExpressionInfo>): IEnumerable < Expression >
    {
        for(let info of expressions) {
            yield return info.Expression;
        }
    }

        public GenerateQuantfiers(predicates: List < ExpressionInfo >, numExpressions: number, maxVariable: number, maxExpansion: number, maxQuantifiers: number): List < ExpressionInfo >
    {
        let result: List < ExpressionInfo > = new List<ExpressionInfo>();
        let allBindings = MergeBindings(predicates);
        let allTypes = VariablesByType(allBindings);
        for(let exp = 0; exp<numExpressions; ++exp)
            {
        let expression = RandomChoice(predicates);
        let info: ExpressionInfo = new ExpressionInfo(expression.Expression);
        let numQuants: number = 1 + Rand.Next(maxQuantifiers - 1);
        let chosen: HashSet < string > = new HashSet<string>();
        let maxBase: number = Math.Min(expression.Bindings.Count, numQuants);
        for(let quant = 0; quant<maxBase; ++quant)
{
    baseBinding: KeyValuePair<string, Comparison>;

    // Can only map each expression variable once in a quantifier
    do {
        baseBinding = expression.Bindings.ElementAt(Rand.Next(expression.Bindings.Count));
    }
    while (chosen.Contains(baseBinding.Key));
    chosen.Add(baseBinding.Key);
    SplitMemory(baseBinding.Key, out var baseName);
    let mappings: List<string> = new List<string>();
    let expansion: number = 1 + Rand.Next(maxExpansion - 1);
    for (let i = 0; i < expansion; ++i) {
        if (i == 0) {
            mappings.Add($"{baseBinding.Key}");
        }
        else {
            let mapping = RandomChoice<string>(allTypes[baseBinding.Value.Value.GetType()]);
            if (!mappings.Contains(mapping)) {
                mappings.Add(mapping);
            }
        }
    }

    let any: boolean = Rand.NextDouble() < 0.5;
    if (any) {
        let mem = RandomChoice(mappings);
        if (!info.Bindings.ContainsKey(mem)) {
            info.Bindings.Add(mem, baseBinding.Value);
        }

        info.Quantifiers.Add(new Quantifier(baseBinding.Key, QuantifierType.Any, mappings));
    }
    else {
        for (let mapping of mappings) {
            if (!info.Bindings.ContainsKey(mapping)) {
                info.Bindings.Add(mapping, baseBinding.Value);
            }
        }

        info.Quantifiers.Add(new Quantifier(baseBinding.Key, QuantifierType.All, mappings));
    }
}

result.Add(info);
            }

return result;
        }

        public GenerateNots(predicates: IList < ExpressionInfo >, numNots: number): IEnumerable < ExpressionInfo >
    {
        for(let i = 0; i <numNots; ++i)
{
    let expr = RandomChoice(predicates);
    let bindings: Dictionary<string, Comparison> = new Dictionary<string, Comparison>();
    for (let binding of expr.Bindings) {
        let comparison = NotValue(binding.Value);
        if (comparison != null) {
            bindings.Add(binding.Key, comparison);
        }
    }

    yield return new ExpressionInfo(Expression.NotExpression(expr.Expression), bindings, expr.Quantifiers);
}
        }

        public MergeBindings(expressions: IEnumerable<ExpressionInfo>): Dictionary < string, Comparison >
{
    let bindings: Dictionary < string, Comparison> = new Dictionary<string, Comparison>();
for (let info of expressions) {
    for (let binding of info.Bindings) {
        bindings[binding.Key] = binding.Value;
    }
}

return bindings;
        }

        public T RandomChoice<T>(choices: IList<T>) => choices[Rand.Next(choices.Count)];

        public T RandomWeighted<T>(choices: IEnumerable<WeightedChoice<T>>)
        {
        let totalWeight: number = 0.0;
        for(let choice of choices) {
            totalWeight += choice.Weight;
        }

            let selection: number = Rand.NextDouble() * totalWeight;
        let soFar: number = 0.0;
        let result = default(T);
            for(let choice of choices) {
            if (soFar <= selection) {
                soFar += choice.Weight;
                result = choice.Choice;
            }
            else {
                break;
            }
        }

            return result;
    }

        public RandomWeighted(weights: IReadOnlyList<number>): number
        {
            let totalWeight: number = 0.0;
            for(let weight of weights) {
                totalWeight += weight;
            }

            let selection: number = Rand.NextDouble() * totalWeight;
            let soFar: number = 0.0;
            let result: number = 0;
            for(let i = 0; i<weights.Count; ++i)
            {
        if(soFar <= selection)
{
    soFar += weights[i];
    result = i;
}
                else
{
    break;
}
            }

return result;
        }

        private SplitMemory(mem: string, baseName: string): number
{
    let i = 0;
    for (; i < mem.Length; ++i) {
        if (char.IsDigit(mem[i])) {
            break;
        }
    }

    baseName = mem.Substring(0, i);
    return int.Parse(mem.Substring(i));
}

        private AdjustValue(value: number, type: string): number
{
    let result: number = value;
    const epsilon: number = 1;
    switch (type) {
        case ExpressionType.LessThan: result += epsilon; break;
        case ExpressionType.NotEqual: result += epsilon; break;
        case ExpressionType.GreaterThan: result -= epsilon; break;
    }

    return result;
}

        private AdjustValue(value: number, type: string): number
{
    let result: number = value;
    switch (type) {
        case ExpressionType.LessThan: result += DoubleEpsilon; break;
        case ExpressionType.NotEqual: result += DoubleEpsilon; break;
        case ExpressionType.GreaterThan: result -= DoubleEpsilon; break;
    }

    return result;
}

        private NotValue(comparison: Comparison): Comparison
{
    let value: number = comparison.Value;
    let type: string = value.GetType();
    let isNot: boolean = false;

    if (type != typeof (int) && type != typeof (double) && type != typeof (string)) {
        throw new Exception($"Unsupported type {type}");
    }

    switch (comparison.Type) {
        case ExpressionType.LessThanOrEqual:
        case ExpressionType.LessThan:
            {
                if (type == typeof (int)) {
                    value = (int)value + 1;
                }
                else if (type == typeof (double)) {
                    value = (double)value + DoubleEpsilon;
                }
            }

            break;
        case ExpressionType.Equal:
            {
                if (type == typeof (int)) {
                    value = (int)value - 1;
                }
                else if (type == typeof (double)) {
                    value = (double)value - DoubleEpsilon;
                }
            }

            break;
        case ExpressionType.NotEqual:
            {
                if (type == typeof (int)) {
                    value = (int)value - 1;
                }
                else if (type == typeof (double)) {
                    value = (double)value - DoubleEpsilon;
                }
            }

            break;
        case ExpressionType.GreaterThanOrEqual:
        case ExpressionType.GreaterThan:
            {
                if (type == typeof (int)) {
                    value = (int)value - 1;
                }
                else if (type == typeof (double)) {
                    value = (double)value - DoubleEpsilon;
                }
            }

            break;
        case ExpressionType.Not:
            {
                isNot = true;
            }

            break;
    }

    return isNot ? null : new Comparison(comparison.Type, value);
}

        private VariablesByType(bindings: Dictionary<string, Comparison>): Dictionary < Type, List < string >>
{
    let result: Dictionary < Type, List<string>> = new Dictionary<Type, List<string>>();
for (let binding of bindings) {
    let type: number = binding.Value.Value.GetType();
    if (!result.ContainsKey(type)) {
        result.Add(type, new List<string>());
    }

    result[type].Add(binding.Key);
}

return result;
        }
    }
}