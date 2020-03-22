// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

//#pragma warning disable SA1601 // Partial elements should be documented

namespace Microsoft.Bot.Expressions.TriggerTrees.Tests
{
    public class Generator
    {
        public class WeightedChoice<T>
        {
            public Weight: number = 0.0;

            public Choice: T = default(T);
        }
    }
}