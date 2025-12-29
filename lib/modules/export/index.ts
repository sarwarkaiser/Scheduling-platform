// Export module - PDF, CSV, iCal

import PDFDocument from 'pdfkit'
import { createObjectCsvWriter } from 'csv-writer'
import ical from 'ical-generator'
import { prisma } from '@/lib/prisma'

export class ExportModule {
  async exportPDF(assignments: any[], output: NodeJS.WritableStream) {
    const doc = new PDFDocument()
    doc.pipe(output)

    doc.fontSize(20).text('Schedule Export', { align: 'center' })
    doc.moveDown()

    for (const assignment of assignments) {
      doc.fontSize(12).text(`Assignment: ${assignment.id}`)
      doc.fontSize(10).text(`Resident: ${assignment.resident.name}`)
      doc.fontSize(10).text(`Date: ${assignment.shiftInstance.date}`)
      doc.moveDown()
    }

    doc.end()
  }

  async exportCSV(assignments: any[], outputPath: string) {
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'resident', title: 'Resident' },
        { id: 'site', title: 'Site' },
        { id: 'role', title: 'Role' },
        { id: 'startTime', title: 'Start Time' },
        { id: 'endTime', title: 'End Time' },
      ],
    })

    const records = assignments.map(a => ({
      date: a.shiftInstance.date.toISOString(),
      resident: a.resident.name,
      site: a.site.name,
      role: a.role,
      startTime: a.shiftInstance.startTime.toISOString(),
      endTime: a.shiftInstance.endTime.toISOString(),
    }))

    await csvWriter.writeRecords(records)
  }

  async exportICal(assignments: any[], output: NodeJS.WritableStream) {
    const calendar = ical({ name: 'Schedule' })

    for (const assignment of assignments) {
      calendar.createEvent({
        start: assignment.shiftInstance.startTime,
        end: assignment.shiftInstance.endTime,
        summary: `Shift - ${assignment.role}`,
        description: `Site: ${assignment.site.name}\nResident: ${assignment.resident.name}`,
        location: assignment.site.name,
      })
    }

    output.write(calendar.toString())
    output.end()
  }
}
