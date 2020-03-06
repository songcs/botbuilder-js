/**
 * @module botbuilder-core
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ConversationReference } from '@chrimc62/botframework-schema';

export interface SkillConversationReference {
    conversationReference: ConversationReference;
    oAuthScope: string;
}
