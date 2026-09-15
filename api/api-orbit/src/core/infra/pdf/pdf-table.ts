import PDFDocument from 'pdfkit';

export interface PdfColumn {
	label: string;
	width: number;
}

export interface PdfReportOptions {
	title: string;
	subtitle: string;
	filterLine: string | null;
	columns: readonly PdfColumn[];
	rows: string[][];
	emptyMessage: string;
}

/**
 * Desenha um relatório tabular simples em PDF (cabeçalho + linhas
 * zebradas + paginação automática). Compartilhado pelos relatórios de
 * tenants e de subscriptions pra não duplicar a lógica de layout do pdfkit.
 */
export function generatePdfTableReport(options: PdfReportOptions): Promise<Buffer> {
	const { title, subtitle, filterLine, columns, rows, emptyMessage } = options;

	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 40, size: 'A4' });
		const chunks: Buffer[] = [];
		doc.on('data', (chunk) => chunks.push(chunk));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);

		const left = doc.page.margins.left;
		const totalWidth = columns.reduce((s, c) => s + c.width, 0);

		doc.fontSize(18).fillColor('#000').text(title);
		doc.fontSize(9).fillColor('#666').text(subtitle);
		if (filterLine) doc.text(filterLine);
		doc.moveDown(1);

		const drawHeader = () => {
			const y = doc.y;
			doc.rect(left, y, totalWidth, 18).fill('#1e293b');
			doc.fillColor('#fff').fontSize(9);
			let x = left;
			for (const col of columns) {
				doc.text(col.label, x + 4, y + 5, { width: col.width - 8 });
				x += col.width;
			}
			doc.y = y + 20;
			doc.fillColor('#000');
		};

		drawHeader();
		doc.fontSize(8);

		rows.forEach((row, index) => {
			if (doc.y > doc.page.height - doc.page.margins.bottom - 30) {
				doc.addPage();
				drawHeader();
			}

			const y = doc.y;
			if (index % 2 === 1) {
				doc.rect(left, y, totalWidth, 16).fill('#f1f5f9');
				doc.fillColor('#000');
			}

			let x = left;
			for (let i = 0; i < columns.length; i++) {
				doc.text(row[i] ?? '', x + 4, y + 4, { width: columns[i].width - 8, ellipsis: true });
				x += columns[i].width;
			}
			doc.y = y + 16;
		});

		if (rows.length === 0) {
			doc.fontSize(10).fillColor('#666').text(emptyMessage);
		}

		doc.end();
	});
}
