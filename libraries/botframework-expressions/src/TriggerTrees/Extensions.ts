
import { RelationshipType } from '../../src/TriggerTrees/RelationshipType';

/// <summary>
/// Extension method to swap between <see cref="RelationshipType"/> "Generalizes" and "Specializes".
/// </summary>
export class Extensions {
    public static Swap(original: RelationshipType): RelationshipType {
        var relationship = original;
        switch (original) {
            case RelationshipType.Specializes:
                relationship = RelationshipType.Generalizes;
                break;
            case RelationshipType.Generalizes:
                relationship = RelationshipType.Specializes;
                break;
        }

        return relationship;
    }
}
