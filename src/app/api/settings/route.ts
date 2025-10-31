
import { NextResponse } from "next/server";
import { getSettingsFromDB, updateSettingInDB } from "@/lib/settings-db";

export async function GET() {
  try {
    const settings = await getSettingsFromDB();
    return NextResponse.json(settings);
  } catch (error) {
    return new NextResponse(error.message, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();
    const updatedSetting = await updateSettingInDB(key, value);
    return NextResponse.json(updatedSetting);
  } catch (error) {
    return new NextResponse(error.message, { status: 500 });
  }
}
