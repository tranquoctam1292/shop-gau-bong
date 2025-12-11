/**
 * Script to create admin user
 * 
 * Usage: npm run create:admin-user
 * 
 * This will create an admin user in MongoDB
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';
import { connectDB, getCollections, closeDB } from '@/lib/db';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

async function createAdminUser() {
  console.log(`${colors.cyan}=== Create Admin User ===${colors.reset}\n`);

  // Get user input (in a real script, you'd use readline or prompt)
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Admin User';

  try {
    // Connect to MongoDB
    console.log(`${colors.yellow}Connecting to MongoDB...${colors.reset}`);
    await connectDB();
    const { users } = await getCollections();
    console.log(`${colors.green}✓ Connected${colors.reset}\n`);

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      console.log(`${colors.yellow}⚠ User with email ${email} already exists${colors.reset}`);
      console.log(`${colors.yellow}Updating password...${colors.reset}`);
      
      // Update password
      const hashedPassword = await bcrypt.hash(password, 10);
      await users.updateOne(
        { email },
        {
          $set: {
            password: hashedPassword,
            role: 'admin',
            name,
            updatedAt: new Date(),
          },
        }
      );
      
      console.log(`${colors.green}✓ Password updated${colors.reset}\n`);
    } else {
      // Create new admin user
      console.log(`${colors.yellow}Creating admin user...${colors.reset}`);
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await users.insertOne({
        email,
        password: hashedPassword,
        name,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log(`${colors.green}✓ Admin user created${colors.reset}\n`);
    }

    console.log(`${colors.cyan}=== Admin User Info ===${colors.reset}`);
    console.log(`Email: ${colors.green}${email}${colors.reset}`);
    console.log(`Password: ${colors.green}${password}${colors.reset}`);
    console.log(`Name: ${colors.green}${name}${colors.reset}`);
    console.log(`\n${colors.yellow}⚠ Please change the password after first login!${colors.reset}\n`);

    // Close database connection
    await closeDB();
  } catch (error: any) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    await closeDB();
    process.exit(1);
  }
}

createAdminUser();

