// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

//#pragma warning disable SA1601 // Partial elements should be documented

namespace Microsoft.Bot.Expressions.TriggerTrees.Tests
{
    public class Generator
    {
        public class SimpleValues
        {

            Int: number = 1;
            Double: number = 2.0;
            String: string = "3";
            Object: object = null;

            public constructor SimpleValues()
            {
            }

            public constructor SimpleValues(integer: number)
            {
                Int = integer;
            }

            public constructor SimpleValues(number: number)
            {
                Double = number;
            }

            public constructor SimpleValues(obj: object)
            {
                Object = obj;
            }

            public static Test(obj: SimpleValues, value: number?): booelan => value.HasValue && obj.Int == value;

            public static Test(obj: SimpleValues, value: number?): boolean => value.HasValue && obj.Double == value;

            public static Test(obj: SimpleValues, value: string): boolean => value != null && obj.String == value;

            public static Test(obj: SimpleValues, other: object): boolean => other != null && obj.Object.Equals(other);

            public Test(value: number?): boolean => value.HasValue && Int == value;

            public Test(value: number?): boolean => value.HasValue && Double == value;

            public Test(value: string): boolean => value != null && String == value;

            public Test(value: SimpleValues): boolean => Int == value.Int && Double == value.Double && String == value.String && Object.Equals(value.Object);
        }
    }
}
