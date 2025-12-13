/**
 * Migration Script: Users to Admin Users
 * 
 * Migrates admin users from `users` collection to `admin_users` collection
 * This script is for migrating from old auth system to new RBAC system
 * 
 * Usage: npm run migrate:users-to-admin-users
 * 
 * Logic:
 * 1. Query all users with role = 'admin' from `users` collection
 * 2. Transform data to AdminUser schema
 * 3. Insert into `admin_users` collection
 * 4. Log migration results
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { connectDB, getCollections, closeDB, ObjectId } from '@/lib/db';
import { AdminRole } from '@/types/admin';
import { hashPassword, generateRandomPassword } from '@/lib/utils/passwordUtils';
import fs from 'fs';
import path from 'path';

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

/**
 * Generate username from email
 * Example: admin@example.com -> admin
 */
function generateUsernameFromEmail(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function migrateUsersToAdminUsers() {
  console.log(`${colors.cyan}=== Migration: Users to Admin Users ===${colors.reset}\n`);

  try {
    // Connect to MongoDB
    console.log(`${colors.yellow}Connecting to MongoDB...${colors.reset}`);
    await connectDB();
    const { users, adminUsers } = await getCollections();
    console.log(`${colors.green}✓ Connected${colors.reset}\n`);

    // Query all admin users from old users collection
    console.log(`${colors.yellow}Querying admin users from 'users' collection...${colors.reset}`);
    const oldAdminUsers = await users.find({ role: 'admin' }).toArray();
    console.log(`${colors.green}✓ Found ${oldAdminUsers.length} admin user(s)${colors.reset}\n`);

    if (oldAdminUsers.length === 0) {
      console.log(`${colors.yellow}⚠ No admin users found in 'users' collection${colors.reset}`);
      console.log(`${colors.blue}ℹ You can create admin users using: npm run seed:admin-users${colors.reset}\n`);
      await closeDB();
      return;
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    const passwordLog: Array<{ email: string; username: string; password: string }> = [];

    // Migrate each user
    for (const oldUser of oldAdminUsers) {
      try {
        const email = oldUser.email as string;
        
        // Check if user already exists in admin_users by email or username
        const username = generateUsernameFromEmail(email);
        const existingUser = await adminUsers.findOne({
          $or: [
            { email },
            { username },
          ],
        });

        if (existingUser) {
          console.log(`${colors.yellow}⚠ Skipping ${email} (already exists in admin_users)${colors.reset}`);
          skipped++;
          continue;
        }

        // CRITICAL FIX: Generate random password if user doesn't have password_hash
        // This prevents lockout for users migrated from OAuth (Google, etc.)
        let password_hash = oldUser.password || oldUser.password_hash;
        let generatedPassword: string | null = null;
        
        if (!password_hash || password_hash === '') {
          // Generate random password for users without password (e.g., OAuth users)
          generatedPassword = generateRandomPassword();
          password_hash = await hashPassword(generatedPassword);
          console.log(`${colors.yellow}⚠ Generated password for ${email} (no password_hash found)${colors.reset}`);
        } else if (typeof password_hash === 'string' && !password_hash.startsWith('$2')) {
          // If password is plain text (shouldn't happen but handle it), hash it
          password_hash = await hashPassword(password_hash);
        }

        // Transform data to AdminUser schema
        const adminUserDoc: any = {
          username,
          email,
          password_hash,
          full_name: oldUser.name || oldUser.full_name || email.split('@')[0],
          role: AdminRole.SUPER_ADMIN, // Default to SUPER_ADMIN for migrated users
          is_active: oldUser.is_active !== undefined ? oldUser.is_active : true,
          must_change_password: true, // Force password change for security
          token_version: 0, // V1.2: Initialize token version
          createdAt: oldUser.createdAt || new Date(),
          updatedAt: new Date(),
        };

        // Preserve last_login if exists
        if (oldUser.last_login) {
          adminUserDoc.last_login = oldUser.last_login;
        }

        // Insert into admin_users collection
        await adminUsers.insertOne(adminUserDoc);
        
        // Log generated passwords for Super Admin to send to users
        if (generatedPassword) {
          passwordLog.push({
            email,
            username,
            password: generatedPassword,
          });
        }
        
        console.log(`${colors.green}✓ Migrated: ${email} -> ${username} (${adminUserDoc.full_name})${colors.reset}`);
        migrated++;

      } catch (error: any) {
        console.error(`${colors.red}✗ Error migrating user ${oldUser.email}: ${error.message}${colors.reset}`);
        errors++;
      }
    }

    // Print summary
    console.log(`\n${colors.cyan}=== Migration Summary ===${colors.reset}`);
    console.log(`${colors.green}✓ Migrated: ${migrated} user(s)${colors.reset}`);
    if (skipped > 0) {
      console.log(`${colors.yellow}⚠ Skipped: ${skipped} user(s)${colors.reset}`);
    }
    if (errors > 0) {
      console.log(`${colors.red}✗ Errors: ${errors} user(s)${colors.reset}`);
    }
    
    // CRITICAL FIX: Save generated passwords to file for Super Admin
    if (passwordLog.length > 0) {
      const logFile = path.join(process.cwd(), 'migration-passwords.json');
      fs.writeFileSync(logFile, JSON.stringify(passwordLog, null, 2), 'utf-8');
      console.log(`\n${colors.yellow}⚠ IMPORTANT: ${passwordLog.length} user(s) had passwords generated${colors.reset}`);
      console.log(`${colors.cyan}Generated passwords saved to: ${logFile}${colors.reset}`);
      console.log(`${colors.yellow}Please send these credentials to users securely (e.g., email, encrypted message)${colors.reset}`);
      console.log(`${colors.yellow}Users MUST change password on first login${colors.reset}\n`);
    }
    
    console.log(`\n${colors.yellow}⚠ Note: All migrated users must change their password on first login${colors.reset}\n`);

    // Close database connection
    await closeDB();
  } catch (error: any) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    console.error(error.stack);
    await closeDB();
    process.exit(1);
  }
}

migrateUsersToAdminUsers();
