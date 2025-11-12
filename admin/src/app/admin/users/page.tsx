"use client";

import React from "react";
import { Table } from "@shared/core/components/ui";
import { Edit, Trash, User, Mail, Shield } from "lucide-react";

const users = [
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },

        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },

        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
        { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },
    { id: 1, name: "Nguyễn Văn A", email: "a@gmail.com", role: "Admin" },
    { id: 2, name: "Trần Thị B", email: "b@gmail.com", role: "User" },


];

export default function UserListPage() {
    const columns = [
        {
        key: "name",
        title: "Tên người dùng",
        icon: User,
        align: "left" as const,
        width: 200,
        },
        {
        key: "email",
        title: "Email",
        icon: Mail,
        align: "left" as const,
        width: 220,
        },
        {
        key: "role",
        title: "Vai trò",
        icon: Shield,
        align: "center" as const,
        width: 120,
        render: (user: any) => (
        <div className="flex justify-center">
            <span
            className={`px-2 py-1 text-xs rounded-full ${
                user.role === "Admin"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-900 text-gray-100"
            }`}
            >
            {user.role}
            </span>
        </div>
        )
    },
    {
        key: "actions",
        title: "Hành động",
        align: "center" as const,
        width: 120,
        render: (user: any) => (
            <div className="flex justify-center gap-2">
            <button
                className="p-1 rounded hover:bg-blue-100 text-blue-600"
                title="Chỉnh sửa"
            >
                <Edit className="w-4 h-4" />
            </button>
            <button
                className="p-1 rounded hover:bg-red-100 text-red-600"
                title="Xóa"
            >
                <Trash className="w-4 h-4" />
            </button>
            </div>
        ),
        },
    ];

    return (
        <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-900">
            Danh sách người dùng
        </h1>

        <Table
            columns={columns}
            data={users}
            showIndex
            // headerColor="bg-gray-50 dark:bg-gray-800"
            // paginationBg="bg-white dark:bg-gray-900"
            // paginationActiveColor="bg-blue-500 text-white border-blue-500"
            rowsPerPage={8}
        />
        ///////////
        <br></br>
        /////////////////
        <br></br>
        ///////////
        <br></br>
        /////////////////
        <br></br>
                ///////////
        <br></br>
        /////////////////
        <br></br>

                ///////////
        <br></br>
        /////////////////
        <br></br>        ///////////
        <br></br>
        /////////////////
        <br></br>
                ///////////
        <br></br>
        /////////////////
        <br></br>
                ///////////
        <br></br>
        /////////////////
        <br></br>
                ///////////
        <br></br>
        /////////////////
        <br></br>
                ///////////
        <br></br>
        /////////////////
        <br></br>
                ///////////
        <br></br>
        /////////////////
        <br></br>        ///////////
        <br></br>
        /////////////////
        <br></br>
        
        </div>
    );
}
