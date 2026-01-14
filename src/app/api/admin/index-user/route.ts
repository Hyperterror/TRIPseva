import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { SearchIndexManager } from "@/services/SearchIndexManager";

/**
 * POST /api/admin/index-user
 * Manually index a specific user's profile
 * Useful for debugging or re-indexing individual users
 */
export async function POST(request: NextRequest) {
  try {
    await connect();

    // Authentication check
    const { userId: requestingUserId } = await auth();
    if (!requestingUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    console.log(`[Index User] Indexing user ${userId} requested by ${requestingUserId}`);

    // Check if user has complete profile
    const hasCompleteProfile = await SearchIndexManager.hasCompleteProfile(userId);
    
    if (!hasCompleteProfile) {
      return NextResponse.json(
        {
          error: "User does not have complete profile",
          message: "User must have both lifestyle and food preferences to be indexed"
        },
        { status: 400 }
      );
    }

    // Index the user
    const result = await SearchIndexManager.indexUserProfile(userId);

    if (result.success) {
      return NextResponse.json(
        {
          message: "User indexed successfully",
          data: {
            userId: result.userId,
            operation: result.operation
          }
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          error: "Failed to index user",
          data: {
            userId: result.userId,
            operation: result.operation,
            error: result.error
          }
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("[POST /api/admin/index-user] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to index user",
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/index-user
 * Remove a specific user from the search index
 */
export async function DELETE(request: NextRequest) {
  try {
    await connect();

    // Authentication check
    const { userId: requestingUserId } = await auth();
    if (!requestingUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    console.log(`[Remove User Index] Removing user ${userId} from index requested by ${requestingUserId}`);

    // Remove the user from index
    const result = await SearchIndexManager.removeUserProfile(userId);

    if (result.success) {
      return NextResponse.json(
        {
          message: "User removed from index successfully",
          data: {
            userId: result.userId,
            operation: result.operation
          }
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          error: "Failed to remove user from index",
          data: {
            userId: result.userId,
            operation: result.operation,
            error: result.error
          }
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("[DELETE /api/admin/index-user] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to remove user from index",
        details: error.message
      },
      { status: 500 }
    );
  }
}