/**
 * Seed Admin Users Script
 * 
 * Creates sample admin users with different roles for testing
 * 
 * Usage: npm run seed:admin-users
 * 
 * Creates users:
 * - SUPER_ADMIN: admin / ChangeMe@123
 * - PRODUCT_MANAGER: product / ChangeMe@123
 * - ORDER_MANAGER: order / ChangeMe@123
 * - CONTENT_EDITOR: editor / ChangeMe@123
 * - VIEWER: viewer / ChangeMe@123
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

interface SeedUser {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: AdminRole;
}

// Default password for all seed users (should be changed on first login)
const DEFAULT_PASSWORD = 'ChangeMe@123';

// Seed users data
const seedUsers: SeedUser[] = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: DEFAULT_PASSWORD,
    full_name: 'Super Admin',
    role: AdminRole.SUPER_ADMIN,
  },
  {
    username: 'product',
    email: 'product@example.com',
    password: DEFAULT_PASSWORD,
    full_name: 'Product Manager',
    role: AdminRole.PRODUCT_MANAGER,
  },
  {
    username: 'order',
    email: 'order@example.com',
    password: DEFAULT_PASSWORD,
    full_name: 'Order Manager',
    role: AdminRole.ORDER_MANAGER,
  },
  {
    username: 'editor',
    email: 'editor@example.com',
    password: DEFAULT_PASSWORD,
    full_name: 'Content Editor',
    role: AdminRole.CONTENT_EDITOR,
  },
  {
    username: 'viewer',
    email: 'viewer@example.com',
    password: DEFAULT_PASSWORD,
    full_name: 'Viewer',
    role: AdminRole.VIEWER,
  },
];

async function seedAdminUsers() {
  console.log(`${colors.cyan}=== Seed Admin Users ===${colors.reset}\n`);

  try {
    // Connect to MongoDB
    console.log(`${colors.yellow}Connecting to MongoDB...${colors.reset}`);
    await connectDB();
    const { adminUsers } = await getCollections();
    console.log(`${colors.green}✓ Connected${colors.reset}\n`);

    let created = 0;
    let skipped = 0;
    let updated = 0;

    // Create or update each seed user
    for (const userData of seedUsers) {
      try {
        // Check if user already exists
        const existingUser = await adminUsers.findOne({
          $or: [
            { username: userData.username },
            { email: userData.email },
          ],
        });

        if (existingUser) {
          // Update existing user (preserve password if unchanged)
          console.log(`${colors.yellow}⚠ User ${userData.username} already exists${colors.reset}`);
          
          // Check if we should update password (only if using default password)
          const shouldUpdatePassword = process.env.FORCE_UPDATE_PASSWORDS === 'true';
          
          const updateData: any = {
            full_name: userData.full_name,
            role: userData.role,
            updatedAt: new Date(),
          };

          if (shouldUpdatePassword) {
            updateData.password_hash = await hashPassword(userData.password);
            updateData.must_change_password = true;
            updateData.token_version = (existingUser.token_version || 0) + 1; // Increment to force logout
          }

          await adminUsers.updateOne(
            { _id: existingUser._id },
            { $set: updateData }
          );
          
          console.log(`${colors.blue}ℹ Updated: ${userData.username}${colors.reset}`);
          updated++;
        } else {
          // Create new user
          const password_hash = await hashPassword(userData.password);
          
          const adminUserDoc: any = {
            username: userData.username,
            email: userData.email,
            password_hash,
            full_name: userData.full_name,
            role: userData.role,
            is_active: true,
            must_change_password: true, // Force password change on first login
            token_version: 0, // V1.2: Initialize token version
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await adminUsers.insertOne(adminUserDoc);
          
          console.log(`${colors.green}✓ Created: ${userData.username} (${userData.full_name}) - Role: ${userData.role}${colors.reset}`);
          created++;
        }
      } catch (error: any) {
        console.error(`${colors.red}✗ Error creating user ${userData.username}: ${error.message}${colors.reset}`);
      }
    }

    // Print summary
    console.log(`\n${colors.cyan}=== Seed Summary ===${colors.reset}`);
    console.log(`${colors.green}✓ Created: ${created} user(s)${colors.reset}`);
    if (updated > 0) {
      console.log(`${colors.blue}ℹ Updated: ${updated} user(s)${colors.reset}`);
    }
    if (skipped > 0) {
      console.log(`${colors.yellow}⚠ Skipped: ${skipped} user(s)${colors.reset}`);
    }
    
    console.log(`\n${colors.cyan}=== Login Credentials ===${colors.reset}`);
    seedUsers.forEach((user) => {
      console.log(`${colors.yellow}Username:${colors.reset} ${user.username} | ${colors.yellow}Password:${colors.reset} ${DEFAULT_PASSWORD} | ${colors.yellow}Role:${colors.reset} ${user.role}`);
    });
    console.log(`\n${colors.red}⚠ SECURITY WARNING: All users must change their password on first login!${colors.reset}\n`);

    // Close database connection
    await closeDB();
  } catch (error: any) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    console.error(error.stack);
    await closeDB();
    process.exit(1);
  }
}

seedAdminUsers();
