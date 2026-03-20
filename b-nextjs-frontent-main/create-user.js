
import { getPayload } from 'payload'
import configPromise from './src/payload.config.js'

async function run() {
  const payload = await getPayload({ config: configPromise })
  
  await payload.create({
    collection: 'user-profile',
    data: {
      email: 'demo@example.com',
      password: 'password',
    },
  })
  
  console.log('User created successfully')
  process.exit(0)
}

run()
