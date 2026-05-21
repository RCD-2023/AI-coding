"use server";

import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/actions/helpers";

export async function changePassword(
  _prev: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const authResult = await requireAuth();
  if (!authResult) return { error: "Unauthorized" };
  const { userId } = authResult;

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user?.password) return { error: "No password set for this account" };

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return { error: "Current password is incorrect" };

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return { success: "Password updated successfully" };
}

export async function deleteAccount(): Promise<void> {
  const authResult = await requireAuth();
  if (!authResult) redirect("/sign-in");

  await prisma.user.delete({ where: { id: authResult.userId } });
  await signOut({ redirectTo: "/" });
}
