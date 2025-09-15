import { qstash } from "./qstash"

export class QStashScheduler {
  private static instance: QStashScheduler

  static getInstance(): QStashScheduler {
    if (!QStashScheduler.instance) {
      QStashScheduler.instance = new QStashScheduler()
    }
    return QStashScheduler.instance
  }

  async scheduleTask(
    url: string,
    payload: any,
    options: {
      delay?: number // seconds
      cron?: string
      retries?: number
    } = {},
  ): Promise<string | null> {
    try {
      const { delay, cron, retries = 3 } = options

      let result
      if (cron) {
        // Schedule recurring task with cron
        result = await qstash.schedules.create({
          destination: url,
          cron,
          body: JSON.stringify(payload),
          retries,
        })
      } else if (delay) {
        // Schedule one-time delayed task
        result = await qstash.publishJSON({
          url,
          body: payload,
          delay,
          retries,
        })
      } else {
        // Immediate task
        result = await qstash.publishJSON({
          url,
          body: payload,
          retries,
        })
      }

      console.log(`[v0] QStash task scheduled:`, result)
      return result.messageId || result.scheduleId || null
    } catch (error) {
      console.error("QStash scheduling error:", error)
      return null
    }
  }

  async cancelSchedule(scheduleId: string): Promise<boolean> {
    try {
      await qstash.schedules.delete(scheduleId)
      console.log(`[v0] QStash schedule cancelled: ${scheduleId}`)
      return true
    } catch (error) {
      console.error("QStash cancel error:", error)
      return false
    }
  }

  async getSchedules(): Promise<any[]> {
    try {
      const schedules = await qstash.schedules.list()
      return schedules
    } catch (error) {
      console.error("QStash get schedules error:", error)
      return []
    }
  }

  // Common scheduled tasks
  async scheduleReminderNotification(
    orderReference: string,
    customerData: any,
    delayInSeconds: number,
  ): Promise<string | null> {
    const payload = {
      type: "reminder_notification",
      order_reference: orderReference,
      customer_data: customerData,
    }

    return this.scheduleTask(`${process.env.NEXT_PUBLIC_BASE_URL}/api/scheduled/reminder`, payload, {
      delay: delayInSeconds,
    })
  }

  async schedulePaymentCheck(orderReference: string, delayInSeconds: number): Promise<string | null> {
    const payload = {
      type: "payment_check",
      order_reference: orderReference,
    }

    return this.scheduleTask(`${process.env.NEXT_PUBLIC_BASE_URL}/api/scheduled/payment-check`, payload, {
      delay: delayInSeconds,
    })
  }
}

export const scheduler = QStashScheduler.getInstance()
