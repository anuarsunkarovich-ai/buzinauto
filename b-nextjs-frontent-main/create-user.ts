
import { getPayload } from 'payload'
import config from './src/payload.config'

async function run() {
  const payload = await getPayload({ config })
  
  try {
    const user = await payload.create({
      collection: 'user-profile',
      data: {
        email: 'demo@example.com',
        password: 'password',
        name: 'Demo User',
      },
    })
    console.log('User created successfully:', user.email)
  } catch (err) {
    console.error('Error creating user:', err)
  }
  
  process.exit(0)
}

run()
