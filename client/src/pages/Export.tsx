import { useState } from 'react';
import Layout from '../components/Layout';
import { exportApi } from '../api/client';
// Helper to infer type
type ExportData = NonNullable<Awaited<ReturnType<typeof exportApi.getPdfData>>['data']>;
import jsPDF from 'jspdf';

export default function Export() {
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [isLoadingCsv, setIsLoadingCsv] = useState(false);
    const [message, setMessage] = useState('');

    const generatePdf = async () => {
        setIsLoadingPdf(true);
        setMessage('');

        const { data, error } = await exportApi.getPdfData();

        if (error || !data) {
            setMessage(`Error: ${error || 'Failed to load data'}`);
            setIsLoadingPdf(false);
            return;
        }

        try {
            createPdf(data);
            setMessage('PDF generated successfully!');
        } catch (err) {
            setMessage('Error generating PDF');
            console.error(err);
        }

        setIsLoadingPdf(false);
    };

    const createPdf = (data: ExportData) => {
        const doc = new jsPDF();
        let y = 20;
        const lineHeight = 7;
        const margin = 20;

        // Helper to add text with word wrap
        const addText = (text: string, fontSize = 12, isBold = false) => {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            const lines = doc.splitTextToSize(text, 170);
            lines.forEach((line: string) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, margin, y);
                y += lineHeight;
            });
        };

        // Title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(138, 84, 247); // Lavender color
        doc.text('Pregnancy Summary', margin, y);
        y += 15;

        // Reset text color
        doc.setTextColor(0, 0, 0);

        // Generated date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date(data.generatedAt).toLocaleDateString()}`, margin, y);
        y += 15;

        // Pregnancy Info
        addText('Pregnancy Information', 16, true);
        y += 3;
        addText(`Current: Week ${data.pregnancy.week}, Day ${data.pregnancy.day}`);
        addText(`Trimester: ${data.pregnancy.trimesterLabel}`);
        addText(`LMP Date: ${new Date(data.pregnancy.lmpDate).toLocaleDateString()}`);
        addText(`Due Date: ${new Date(data.pregnancy.dueDate).toLocaleDateString()}`);
        addText(`Days Remaining: ${data.pregnancy.daysRemaining}`);
        y += 10;

        // Appointments
        if (data.appointments.length > 0) {
            addText('Upcoming Appointments', 16, true);
            y += 3;
            data.appointments.forEach(apt => {
                const aptDate = new Date(apt.datetime);
                addText(`• ${aptDate.toLocaleDateString()} ${aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${apt.title}`);
                if (apt.location) addText(`  Location: ${apt.location}`);
            });
            y += 10;
        }

        // Recent Logs
        if (data.logs.length > 0) {
            addText('Recent Daily Logs (Last 30 Days)', 16, true);
            y += 3;
            data.logs.slice(0, 10).forEach(log => {
                addText(`${new Date(log.log_date).toLocaleDateString()}`, 11, true);
                if (log.mood) addText(`Mood: ${log.mood}`);
                if (log.symptoms.length > 0) addText(`Symptoms: ${log.symptoms.join(', ')}`);
                if (log.notes) addText(`Notes: ${log.notes}`);
                if (log.weight) addText(`Weight: ${log.weight} kg`);
                if (log.blood_pressure) addText(`Blood Pressure: ${log.blood_pressure}`);
                y += 3;
            });
        }

        // Disclaimer
        y += 10;
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        const disclaimer = 'DISCLAIMER: This summary is for personal record-keeping only and does not constitute medical advice. Always consult a qualified healthcare professional for medical decisions.';
        const disclaimerLines = doc.splitTextToSize(disclaimer, 170);
        disclaimerLines.forEach((line: string) => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, margin, y);
            y += 5;
        });

        // Save
        doc.save('pregnancy_summary.pdf');
    };

    const downloadCsv = async () => {
        setIsLoadingCsv(true);
        setMessage('');

        const { error } = await exportApi.downloadCsv();

        if (error) {
            setMessage(`Error: ${error}`);
        } else {
            setMessage('CSV downloaded successfully!');
        }

        setIsLoadingCsv(false);
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Export Data</h1>
                    <p className="text-gray-600">Download your pregnancy data for your records or doctor visits</p>
                </div>

                {message && (
                    <div className={`px-4 py-3 rounded-xl text-sm ${message.startsWith('Error')
                        ? 'bg-blush-50 border border-blush-200 text-blush-700'
                        : 'bg-mint-50 border border-mint-200 text-mint-700'
                        }`}>
                        {message}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* PDF Export */}
                    <div className="card">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-lavender-100 rounded-full p-4">
                                <span className="text-3xl">📄</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">PDF Summary</h2>
                                <p className="text-sm text-gray-500">Formatted for sharing with your doctor</p>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Generate a comprehensive PDF report including your pregnancy timeline,
                            recent logs, upcoming appointments, and key health metrics.
                        </p>

                        <div className="bg-lavender-50 rounded-xl p-4 mb-6">
                            <h3 className="font-medium text-gray-700 mb-2">Includes:</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>✓ Current pregnancy week and due date</li>
                                <li>✓ Upcoming appointments</li>
                                <li>✓ Last 30 days of logs</li>
                                <li>✓ Vitals if recorded</li>
                            </ul>
                        </div>

                        <button
                            onClick={generatePdf}
                            disabled={isLoadingPdf}
                            className="btn btn-primary w-full"
                        >
                            {isLoadingPdf ? 'Generating...' : 'Download PDF'}
                        </button>
                    </div>

                    {/* CSV Export */}
                    <div className="card">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-mint-100 rounded-full p-4">
                                <span className="text-3xl">📊</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">CSV Data</h2>
                                <p className="text-sm text-gray-500">Raw data for spreadsheets</p>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Export all your daily logs as a CSV file that you can open in Excel,
                            Google Sheets, or any spreadsheet application.
                        </p>

                        <div className="bg-mint-50 rounded-xl p-4 mb-6">
                            <h3 className="font-medium text-gray-700 mb-2">Includes:</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>✓ All daily log entries</li>
                                <li>✓ Symptoms and mood for each day</li>
                                <li>✓ Notes and observations</li>
                                <li>✓ All recorded vitals</li>
                            </ul>
                        </div>

                        <button
                            onClick={downloadCsv}
                            disabled={isLoadingCsv}
                            className="btn btn-mint w-full"
                        >
                            {isLoadingCsv ? 'Downloading...' : 'Download CSV'}
                        </button>
                    </div>
                </div>

                {/* Privacy Note */}
                <div className="card bg-cream-50 border-cream-100">
                    <div className="flex items-start gap-4">
                        <span className="text-2xl">🔒</span>
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-1">Your Privacy</h3>
                            <p className="text-sm text-gray-600">
                                Your data is exported directly to your device. We never share your health
                                information with third parties without your explicit consent.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
