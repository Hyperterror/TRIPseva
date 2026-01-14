import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { UserPreferences } from "@/models/UserPreferences";
import { FoodPreferences } from "@/models/FoodPreferences";
import { SearchIndexManager } from "@/services/SearchIndexManager";

/**
 * DELETE /api/preferences/delete
 * Delete all user preferences (lifestyle and food)
 */
export async function DELETE(request: NextRequest) {
  try {
    await connect();

    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete both lifestyle and food preferences
    const [lifestyleResult, foodResult] = await Promise.all([
      UserPreferences.deleteOne({ userId }),
      FoodPreferences.deleteOne({ userId }),
    ]);

    const deletedCount =
      lifestyleResult.deletedCount + foodResult.deletedCount;

    // Remove from search index if any preferences were deleted
    if (deletedCount > 0) {
      try {
        const indexResult = await SearchIndexManager.removeUserProfile(userId);
        if (!indexResult.success) {
          console.warn(`[Delete Preferences] Search index removal failed for user ${userId}:`, indexResult.error);
        }
      } catch (indexError) {
        // Log but don't fail the request if index removal fails
        console.error(`[Delete Preferences] Search index removal error for user ${userId}:`, indexError);
      }
    }

    if (deletedCount === 0) {
      return NextResponse.json(
        {
          message: "No preferences found to delete",
          deleted: {
            lifestyle: false,
            food: false,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "Preferences deleted successfully",
        deleted: {
          lifestyle: lifestyleResult.deletedCount > 0,
          food: foodResult.deletedCount > 0,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[DELETE /api/preferences/delete] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete preferences" },
      { status: 500 }
    );
  }
}
