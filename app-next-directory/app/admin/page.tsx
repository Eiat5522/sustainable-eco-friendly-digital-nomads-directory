"use client";
import React from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useSession } from "next-auth/react";

export default function AdminPage() {
  return <AdminDashboard />;
}
