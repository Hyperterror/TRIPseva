import {connect} from "@/db/dbconfig"
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {User} from "@/models/userModel";


export async function GET(request: NextRequest){
    try {
        await connect();
        const {userId} = await auth();
        const user = await currentUser();
        if(!user|| !userId){
            console.log("Required user and userId");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const email = user?.primaryEmailAddress?.emailAddress || "";
        const username = user?.username || "";
        const name = user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user?.firstName || user?.username || "User";
        
        const existing = await User.findOne({userId});
        if(existing){
            return NextResponse.json({message: "User already exists", data: existing});
        }
        const newUser = await User.create({
            userId,
            email,
            username,
            name,
        });
        return NextResponse.json({ data: newUser }, { status: 201 });
    } catch (error:any) {
        return NextResponse.json({message: "error"});
    }
}