// =========================================================================
// WhatsApp Business Cloud API — Integration, Templates & Webhook Engine
// =========================================================================

import {
  DBAppointment,
  DBPatient,
  DBMessageLog,
  AppointmentRepository,
  MessageLogRepository,
  PatientRepository,
  PostOpCareService,
} from '@/lib/db';

export interface WhatsAppInteractiveButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

export interface WhatsAppTemplatePayload {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive' | 'text' | 'template';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button';
    header?: {
      type: 'text';
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons: WhatsAppInteractiveButton[];
    };
  };
}

export const WhatsAppService = {
  /**
   * T-24 Hours Reminder
   * Sends interactive WhatsApp message with "Confirm" and "Cancel" buttons.
   */
  async sendT24Reminder(appointment: DBAppointment): Promise<DBMessageLog> {
    const formattedDate = new Date(appointment.slotTime).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const formattedTime = new Date(appointment.slotTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const content = `🏛️ *Vertex Dental Lab — Consultation Reminder (T-24h)*\n\nDear ${appointment.patientName},\n\nYour upcoming clinical appointment is scheduled for tomorrow:\n📅 *Date:* ${formattedDate}\n⏰ *Time:* ${formattedTime}\n👨‍⚕️ *Clinician:* ${appointment.clinicianName}\n🦷 *Treatment:* ${appointment.treatmentType}\n📍 *Location:* 42 Harley Place, Marylebone, London, W1G 9PH\n\nPlease confirm your attendance below so our sterile surgery suite can be prepared for you.`;

    // Simulated interactive Cloud API dispatch payload
    const interactivePayload: WhatsAppTemplatePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: appointment.phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: 'Vertex Dental Studio • Marylebone',
        },
        body: {
          text: content,
        },
        footer: {
          text: 'Please reply using the buttons below',
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: `CONFIRM_${appointment.id}`,
                title: '✅ Confirm Booking',
              },
            },
            {
              type: 'reply',
              reply: {
                id: `CANCEL_${appointment.id}`,
                title: '❌ Cancel / Release Slot',
              },
            },
          ],
        },
      },
    };

    // Log message in database
    return MessageLogRepository.create({
      appointmentId: appointment.id,
      patientPhone: appointment.phoneNumber,
      patientName: appointment.patientName,
      messageType: 'T24_REMINDER',
      templateName: 'vertex_t24_interactive_confirmation_v1',
      content: `${content}\n\n[Interactive Buttons: 1. Confirm Booking | 2. Cancel / Release Slot]`,
      status: 'DELIVERED',
    });
  },

  /**
   * T-2 Hours Final Alert
   * Dispatches clinic address, direct Google Maps pin, and parking instructions.
   */
  async sendT2FinalAlert(appointment: DBAppointment): Promise<DBMessageLog> {
    const formattedTime = new Date(appointment.slotTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const mapsUrl = 'https://maps.google.com/?q=42+Harley+Place+Marylebone+London+W1G+9PH';
    const content = `🚗 *Vertex Dental Lab — Arrival Instructions (T-2h)*\n\nHello ${appointment.patientName},\n\nYour clinical consultation with ${appointment.clinicianName} begins in approximately 2 hours at *${formattedTime}*.\n\n📍 *Exact Address:*\n42 Harley Place, Marylebone, London, W1G 9PH\n\n🗺️ *Direct Google Maps Pin:*\n${mapsUrl}\n\n🅿️ *Parking & Transport:*\n• Q-Park Cavendish Square is a 2-minute walk from our clinic entrance.\n• Tube: Oxford Circus (4 min walk) & Bond Street / Elizabeth Line (6 min walk).\n\nIf you are running late, please notify our reception team immediately by calling +44 20 7946 0888.`;

    return MessageLogRepository.create({
      appointmentId: appointment.id,
      patientPhone: appointment.phoneNumber,
      patientName: appointment.patientName,
      messageType: 'T2_FINAL_ALERT',
      templateName: 'vertex_t2_location_parking_v1',
      content,
      status: 'DELIVERED',
    });
  },

  /**
   * Post-Op Care Automation Trigger
   */
  async sendPostOpCare(appointment: DBAppointment): Promise<DBMessageLog> {
    return PostOpCareService.dispatch(appointment);
  },

  /**
   * 6-Month Patient Recall Dispatch
   */
  async sendRecallInvitation(patient: DBPatient): Promise<DBMessageLog> {
    const bookingUrl = `http://localhost:3000/?action=book&recall=true&patientId=${patient.id}&patientPhone=${encodeURIComponent(patient.phoneNumber)}`;

    const content = `✨ *Vertex Dental Lab — 6-Month Preventive Checkup Due*\n\nDear ${patient.name},\n\nIt has been 6 months since your last clinical hygiene & preventive examination at our Marylebone clinic.\n\nRegular 6-month checkups and airflow biofilm cleanings protect against undetected enamel decay, gum inflammation, and ensure oral longevity.\n\n📅 *Reserve Your 6-Month Checkup with 1 Click:*\n${bookingUrl}\n\nPrefer a phone booking? Call our reception at +44 20 7946 0888.`;

    await PatientRepository.markRecallSent(patient.id);

    return MessageLogRepository.create({
      patientPhone: patient.phoneNumber,
      patientName: patient.name,
      messageType: 'RECALL_6_MONTH',
      templateName: 'vertex_6month_recall_v1',
      content,
      status: 'SENT',
    });
  },

  /**
   * Incoming Webhook Event Processor
   * Handles button replies (CONFIRM, CANCEL) and patient messages.
   */
  async handleIncomingWebhook(payload: {
    from: string;
    text?: string;
    buttonId?: string;
    messageId?: string;
  }): Promise<{ actionTaken: string; replyMessage: string; appointmentId?: string }> {
    const fromPhone = payload.from.trim();
    const buttonId = payload.buttonId || '';
    const incomingText = (payload.text || '').toLowerCase().trim();

    // 1. Handle Interactive Button / Quick-Reply Click
    if (buttonId.startsWith('CONFIRM_')) {
      const aptId = buttonId.replace('CONFIRM_', '');
      const { appointment } = await AppointmentRepository.updateStatus(aptId, 'CONFIRMED');
      
      const reply = `✅ Thank you, ${appointment.patientName}! Your consultation on ${new Date(appointment.slotTime).toLocaleDateString('en-GB')} at ${new Date(appointment.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} is confirmed. We look forward to welcoming you to Vertex Dental Lab.`;

      await MessageLogRepository.create({
        appointmentId: aptId,
        patientPhone: fromPhone,
        patientName: appointment.patientName,
        messageType: 'TRIAGE_RESPONSE',
        templateName: 'vertex_patient_confirmed_ack',
        content: reply,
        status: 'SENT',
      });

      return { actionTaken: 'APPOINTMENT_CONFIRMED', replyMessage: reply, appointmentId: aptId };
    }

    if (buttonId.startsWith('CANCEL_')) {
      const aptId = buttonId.replace('CANCEL_', '');
      const { appointment, reclaimedSlot, waitlistAlerted } = await AppointmentRepository.updateStatus(aptId, 'CANCELLED');

      let reply = `❌ Understood, ${appointment.patientName}. Your appointment on ${new Date(appointment.slotTime).toLocaleDateString('en-GB')} has been cancelled and the clinical slot has been freed.`;
      
      if (waitlistAlerted) {
        reply += ` Priority waitlist patient (${waitlistAlerted.patientName}) has been notified automatically.`;
      }
      reply += ` If you would like to reschedule at another time, please visit our website at http://localhost:3000 or call us at +44 20 7946 0888.`;

      await MessageLogRepository.create({
        appointmentId: aptId,
        patientPhone: fromPhone,
        patientName: appointment.patientName,
        messageType: 'TRIAGE_RESPONSE',
        templateName: 'vertex_patient_cancelled_ack',
        content: reply,
        status: 'SENT',
      });

      return { actionTaken: 'APPOINTMENT_CANCELLED_SLOT_RECLAIMED', replyMessage: reply, appointmentId: aptId };
    }

    // 2. Fallback text parsing ("confirm", "cancel", "haan", "nahi")
    if (incomingText.includes('cancel') || incomingText.includes('nahi') || incomingText.includes('reschedule')) {
      const userApts = (await AppointmentRepository.getAll()).filter(
        a => a.phoneNumber.replace(/\D/g, '') === fromPhone.replace(/\D/g, '') && a.status !== 'CANCELLED'
      );
      if (userApts.length > 0) {
        const targetApt = userApts[0];
        await AppointmentRepository.updateStatus(targetApt.id, 'CANCELLED');
        const reply = `Your appointment for ${targetApt.treatmentType} on ${new Date(targetApt.slotTime).toLocaleDateString('en-GB')} has been cancelled and your slot released.`;
        return { actionTaken: 'TEXT_CANCEL_SLOT_RECLAIMED', replyMessage: reply, appointmentId: targetApt.id };
      }
    }

    if (incomingText.includes('confirm') || incomingText.includes('haan') || incomingText.includes('yes') || incomingText.includes('aunga')) {
      const userApts = (await AppointmentRepository.getAll()).filter(
        a => a.phoneNumber.replace(/\D/g, '') === fromPhone.replace(/\D/g, '') && a.status === 'PENDING'
      );
      if (userApts.length > 0) {
        const targetApt = userApts[0];
        await AppointmentRepository.updateStatus(targetApt.id, 'CONFIRMED');
        const reply = `Your appointment has been successfully marked as CONFIRMED. Thank you!`;
        return { actionTaken: 'TEXT_CONFIRM', replyMessage: reply, appointmentId: targetApt.id };
      }
    }

    // Default triage response
    const defaultReply = `Thank you for contacting Vertex Dental Lab Marylebone. A receptionist will review your message shortly. For immediate emergencies, call +44 20 7946 0888.`;
    return { actionTaken: 'GENERAL_MESSAGE_LOGGED', replyMessage: defaultReply };
  },
};
