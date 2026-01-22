
import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('👤 Creating test user with password...')

  const email = 'test@fantaf1.com'
  const password = 'password123'
  const hashedPassword = await hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: UserRole.PLAYER
    },
    create: {
      email,
      name: 'Test User',
      password: hashedPassword,
      role: UserRole.PLAYER,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
    }
  })

  console.log(`
✅ User created/updated successfully!
-----------------------------------
Email:    ${email}
Password: ${password}
Role:     ${user.role}
-----------------------------------
You can now login at /login
`)
}

main()
  .catch((e) => {
    console.error('❌ Error creating user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
