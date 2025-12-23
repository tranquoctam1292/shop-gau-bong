/**
 * Script to create admin user (RBAC System)
 * 
 * Usage: npm run create:admin-user
 * 
 * This will create an admin user in `admin_users` collection
 * Default role: SUPER_ADMIN
 * Default must_change_password: true
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { connectDB, getCollections, closeDB, ObjectId } from '@/lib/db';
import { AdminRole } from '@/types/admin';
import { hashPassword } from '@/lib/utils/passwordUtils';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

async function createAdminUser() {
  console.log(`${colors.cyan}=== Create Admin User (RBAC) ===${colors.reset}\n`);

  // Get user input from environment variables or use defaults
  const username = process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL?.split('@')[0] || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const full_name = process.env.ADMIN_NAME || 'Admin User';
  const role = (process.env.ADMIN_ROLE as AdminRole) || AdminRole.SUPER_ADMIN;

  try {
    // Connect to MongoDB
    console.log(`${colors.yellow}Connecting to MongoDB...${colors.reset}`);
    await connectDB();
    const { adminUsers } = await getCollections();
    console.log(`${colors.green}✓ Connected${colors.reset}\n`);

    // Check if user already exists (by username or email)
    const existingUser = await adminUsers.findOne({
      $or: [
        { username },
        { email },
      ],
    });

    if (existingUser) {
      console.log(`${colors.yellow}⚠ User with username '${username}' or email '${email}' already exists${colors.reset}`);
      console.log(`${colors.yellow}Updating password and info...${colors.reset}`);
      
      // Update password and info
      const password_hash = await hashPassword(password);
      await adminUsers.updateOne(
        { _id: existingUser._id },
        {
          $set: {
            password_hash,
            full_name,
            role,
            is_active: true,
            must_change_password: true, // Force password change
            token_version: (existingUser.token_version || 0) + 1, // Increment to force logout
            updatedAt: new Date(),
          },
        }
      );
      
      console.log(`${colors.green}✓ User updated${colors.reset}\n`);
    } else {
      // Create new admin user
      console.log(`${colors.yellow}Creating admin user...${colors.reset}`);
      
      const password_hash = await hashPassword(password);
      
      const adminUserDoc: any = {
        username,
        email,
        password_hash,
        full_name,
        role,
        is_active: true,
        must_change_password: true, // Force password change on first login
        token_version: 0, // V1.2: Initialize token version
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await adminUsers.insertOne(adminUserDoc);
      
      console.log(`${colors.green}✓ Admin user created${colors.reset}\n`);
    }

    console.log(`${colors.cyan}=== Admin User Info ===${colors.reset}`);
    console.log(`Username: ${colors.green}${username}${colors.reset}`);
    console.log(`Email: ${colors.green}${email}${colors.reset}`);
    console.log(`Password: ${colors.green}${password}${colors.reset}`);
    console.log(`Full Name: ${colors.green}${full_name}${colors.reset}`);
    console.log(`Role: ${colors.green}${role}${colors.reset}`);
    console.log(`\n${colors.yellow}⚠ SECURITY WARNING: User must change password on first login!${colors.reset}\n`);

    // Close database connection
    await closeDB();
  } catch (error: any) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    console.error(error.stack);
    await closeDB();
    process.exit(1);
  }
}

createAdminUser();

