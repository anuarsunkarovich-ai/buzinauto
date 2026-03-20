'use server'

export const sendCallbackTelegramNotification = async (
  name: string,
  tel: string,
  email?: string,
  issue?: string,
) => {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

  const message = `🚗 <b>Пользователь задал вопрос</b>

👤 <b>Имя:</b> ${name}
📞 <b>Телефон:</b> ${tel}${email ? `\n✉️ <b>Электронная почта:</b> ${email}` : ''}${issue ? `\n🗣 <b>Вопросы:</b> ${issue}` : ''}

#обратный_звонок #callback`

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Telegram API error:', errorData)
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
  }
}

export const sendTelegramNotification = async (name: string, tel: string, car?: string) => {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

  const message = `🚗 <b>Новая заявка на подбор автомобиля</b>

👤 <b>Имя:</b> ${name}
📞 <b>Телефон:</b> ${tel}${car ? `\n🚙 <b>Автомобиль:</b> ${car}` : ''}

#новая_заявка #подбор_авто`

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Telegram API error:', errorData)
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
  }
}
