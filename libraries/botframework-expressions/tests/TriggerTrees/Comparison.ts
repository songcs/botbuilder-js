// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// import { System } from "./FIND SYSTEM PATH";
// import { System.Collections.Generic } from "./FIND PATH";
// import { System.Ling } from "./FIND PATH";
// import { System.Text } from "./FIND PATH";
// import { Microsoft.Bot.Expressions } from "./FIND PATH";

export class Comparison {
    public Type: string;
    public Value: object;
    public constructor(type: string, value: object) {
        this.Type = type;
        this.Value = value;
    }
}