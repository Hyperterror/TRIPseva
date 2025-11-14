import {connect} from "@/db/dbconfig"
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {User} from "@/models/userModel";


export async function GET(request: NextRequest){
    try {
        await connect();
        const {userId} = await auth();
        const user = await currentUser();
        
        if(!user || !userId){
            console.log("[createuser] Missing user or userId");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const email = user?.primaryEmailAddress?.emailAddress || "";
        const username = user?.username || "";
        const name = user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user?.firstName || user?.username || "User";
        
        // Check if user already exists
        const existing = await User.findOne({userId});
        if(existing){
            console.log("[createuser] User already exists:", userId);
            return NextResponse.json({
                message: "User already exists", 
                data: existing
            }, { status: 200 });
        }
        
        // Create new user
        const newUser = await User.create({
            userId,
            email,
            username,
            name,
        });
        
        console.log("[createuser] New user created:", userId);
        return NextResponse.json({ 
            message: "User created successfully",
            data: newUser 
        }, { status: 201 });
        
    } catch (error: any) {
        console.error("[createuser] Error:", error);
        console.error("[createuser] Error details:", error.message);
        
        return NextResponse.json({
            error: "Failed to create user",
            details: error.message
        }, { status: 500 });
    }
}