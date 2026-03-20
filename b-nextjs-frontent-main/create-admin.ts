import 'dotenv/config'
import { getPayload } from 'payload'
import config from './src/payload.config'

async function run() {
  const payload = await getPayload({ config })
  
  try {
    const user = await payload.create({
      collection: 'user-profile',
      data: {
        email: 'admin@buzinavto.ru',
        password: 'password123',
        name: 'Admin',
      },
    })
    console.log('User created successfully:', user.email)
  } catch (err) {
    console.error('Error creating user:', JSON.stringify(err, null, 2))
  }
  
  process.exit(0)
}

run()
