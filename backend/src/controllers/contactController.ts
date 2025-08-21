import { Request, Response } from 'express'
import nodemailer from 'nodemailer'
import pool from '../config/database'

interface ContactFormData {
  project: string
  name: string
  email: string
  job: string
  contact: string
  services: string[]
  notes: string
}

// Create SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const formData: ContactFormData = req.body

    // Validate required fields
    if (!formData.project || !formData.name || !formData.email || !formData.job || !formData.services.length) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      })
      return
    }

    // Store in database
    const insertQuery = `
      INSERT INTO contact_requests (
        project_name, 
        contact_name, 
        contact_email, 
        job_title, 
        contact_method, 
        services_requested, 
        additional_notes, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `

    const result = await pool.query(insertQuery, [
      formData.project,
      formData.name,
      formData.email,
      formData.job,
      formData.contact || '',
      JSON.stringify(formData.services),
      formData.notes || ''
    ])

    const contactId = result.rows[0].id

    // Send email notification
    const transporter = createTransporter()

    // Email to admin
    const adminEmail = {
      from: process.env.EMAIL_FROM || 'noreply@blitzproof.xyz',
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `🔔 New Service Request: ${formData.project}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5078ff;">New Service Request</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Project Details</h3>
            <p><strong>Project/Company:</strong> ${formData.project}</p>
            <p><strong>Contact Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Job Title:</strong> ${formData.job}</p>
            <p><strong>Contact Method:</strong> ${formData.contact || 'Not provided'}</p>
            <p><strong>Services Requested:</strong></p>
            <ul>
              ${formData.services.map(service => `<li>${service}</li>`).join('')}
            </ul>
            ${formData.notes ? `<p><strong>Additional Notes:</strong> ${formData.notes}</p>` : ''}
            <p><strong>Request ID:</strong> #${contactId}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            This request was submitted through the BlitzProof website contact form.
          </p>
        </div>
      `
    }

    // Email to customer (confirmation)
    const customerEmail = {
      from: process.env.EMAIL_FROM || 'noreply@blitzproof.xyz',
      to: formData.email,
      subject: `✅ Service Request Received - ${formData.project}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5078ff;">Thank You for Your Interest!</h2>
          <p>Dear ${formData.name},</p>
          <p>We have received your service request for <strong>${formData.project}</strong> and are excited to work with you!</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Request Summary</h3>
            <p><strong>Project:</strong> ${formData.project}</p>
            <p><strong>Services:</strong> ${formData.services.join(', ')}</p>
            <p><strong>Request ID:</strong> #${contactId}</p>
          </div>

          <h3>What Happens Next?</h3>
          <ol>
            <li>Our team will review your request within 24 hours</li>
            <li>We'll contact you to discuss your specific needs</li>
            <li>You'll receive a detailed proposal and timeline</li>
            <li>Once approved, we'll begin your security audit</li>
          </ol>

          <p>If you have any questions, please don't hesitate to reach out to us.</p>
          
          <p>Best regards,<br>
          The BlitzProof Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated confirmation. Please do not reply to this email.
          </p>
        </div>
      `
    }

    // Send both emails
    await transporter.sendMail(adminEmail)
    await transporter.sendMail(customerEmail)

    console.log(`✅ Contact form submitted successfully - ID: ${contactId}`)

    res.json({
      success: true,
      message: 'Contact form submitted successfully',
      contactId: contactId
    })

  } catch (error) {
    console.error('❌ Contact form submission error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact form'
    })
  }
}

export const getContactRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    const query = `
      SELECT 
        id,
        project_name,
        contact_name,
        contact_email,
        job_title,
        contact_method,
        services_requested,
        additional_notes,
        created_at,
        status
      FROM contact_requests 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `

    const result = await pool.query(query, [limit, offset])
    
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM contact_requests')
    const total = parseInt(countResult.rows[0].total)

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        services_requested: JSON.parse(row.services_requested)
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    })

  } catch (error) {
    console.error('❌ Get contact requests error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact requests'
    })
  }
}
