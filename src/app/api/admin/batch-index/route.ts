import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { SearchIndexManager } from "@/services/SearchIndexManager";

/**
 * POST /api/admin/batch-index
 * Batch index all existing users with complete profiles
 * This is an admin endpoint for initial setup or re-indexing
 */
export async function POST(request: NextRequest) {
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

    // Note: In production, you might want to add admin role checking here
    // For now, any authenticated user can trigger batch indexing

    console.log(`[Batch Index] Starting batch indexing requested by user ${userId}`);

    const result = await SearchIndexManager.batchIndexExistingUsers();

    if (result.success) {
      return NextResponse.json(
        {
          message: "Batch indexing completed successfully",
          data: {
            totalUsers: result.totalUsers,
            indexedUsers: result.indexedUsers,
            coverage: result.indexedUsers > 0 ? 
              Math.round((result.indexedUsers / result.totalUsers) * 100) : 0,
            errors: result.errors
          }
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          error: "Batch indexing failed",
          data: {
            totalUsers: result.totalUsers,
            indexedUsers: result.indexedUsers,
            errors: result.errors
          }
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("[POST /api/admin/batch-index] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to perform batch indexing",
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/batch-index
 * Get indexing statistics
 */
export async function GET(request: NextRequest) {
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

    const stats = await SearchIndexManager.getIndexingStats();

    return NextResponse.json(
      {
        message: "Indexing statistics retrieved successfully",
        data: stats
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("[GET /api/admin/batch-index] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to get indexing statistics",
        details: error.message
      },
      { status: 500 }
    );
  }
}