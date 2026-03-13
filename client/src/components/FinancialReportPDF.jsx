import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register Khmer Font (Example using Hanuman or Noto Sans Khmer from standard CDN)
// Note: React-PDF requires TTF fonts for best non-latin support.
Font.register({
  family: 'KhmerFont',
  src: 'https://fonts.gstatic.com/s/suwannaphum/v6/wXKrE3kVVv-n32O8Xbu2EikM6t6U8w.ttf' // Placeholder TTF, should ideally be Kantumruy Pro if TTF is available
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#ffffff'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 10,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  headerCenter: {
    flex: 1,
    textAlign: 'center',
    alignItems: 'center',
  },
  khmerTitle: {
    fontFamily: 'KhmerFont',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  englishTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerRight: {
    textAlign: 'right',
  },
  reportMeta: {
    fontSize: 9,
    color: '#444',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%', // Replace dynamically based on columns
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f2f2f2',
    padding: 4,
    alignItems: 'center',
  },
  tableCol: {
    width: '25%', // Replace dynamically
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
  },
  tableCellKhmer: {
    fontFamily: 'KhmerFont',
    fontSize: 9,
    marginBottom: 2,
    textAlign: 'center',
  },
  tableCellEnglish: {
    fontSize: 8,
    textAlign: 'center',
  },
  tableCellData: {
    fontSize: 9,
    textAlign: 'center'
  },
  tableCellDataNumber: {
    fontSize: 9,
    textAlign: 'right'
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#666',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 5,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 9,
  }
});

/**
 * Reusable PDF Document Component for GDT Compliant Financial Reports
 * Uses React-PDF to automatically handle A4 layout, margins, and page breaks.
 */
const FinancialReportPDF = ({ 
    reportTypeKhmer = "តារាងតុល្យការសាកល្បង", 
    reportTypeEnglish = "TRIAL BALANCE",
    companyName = "COMPANY NAME",
    period = "For the year ended 2024",
    columns = [], 
    data = [] 
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* ── BILINGUAL HEADER ── */}
      <View style={styles.headerContainer} fixed>
        <View style={styles.logoPlaceholder}>
          <Text style={{ fontSize: 9 }}>LOGO</Text>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.khmerTitle}>{reportTypeKhmer}</Text>
          <Text style={styles.englishTitle}>{reportTypeEnglish}</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.khmerTitle, { fontSize: 10, marginBottom: 2 }]}>{companyName}</Text>
          <Text style={styles.reportMeta}>{period}</Text>
        </View>
      </View>

      {/* ── DUAL LANGUAGE TABLE ── */}
      <View style={styles.table}>
        {/* Table Header Row */}
        <View style={styles.tableRow} fixed>
          {columns.map((col, idx) => (
            <View key={idx} style={[styles.tableColHeader, { width: col.width || '25%' }]}>
              <Text style={styles.tableCellKhmer}>{col.khmerLabel}</Text>
              <Text style={styles.tableCellEnglish}>{col.englishLabel}</Text>
            </View>
          ))}
        </View>

        {/* Table Data Rows */}
        {data.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.tableRow}>
            {columns.map((col, colIndex) => {
              const val = row[col.key];
              const isNumber = typeof val === 'number';
              return (
                <View key={colIndex} style={[styles.tableCol, { width: col.width || '25%' }]}>
                  <Text style={isNumber ? styles.tableCellDataNumber : styles.tableCellData}>
                    {isNumber ? val.toLocaleString('en-US', { minimumFractionDigits: 2 }) : val || ''}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* ── AUTOMATIC FOOTER & PAGE NUMBERS ── */}
      <Text style={styles.footer} fixed>
        Generated by GK SMART Engine | Strictly For Internal Auditing and GDT Compliance Preparation
      </Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `ទំព័រ (Page) ${pageNumber} / ${totalPages}`
      )} fixed />

    </Page>
  </Document>
);

export default FinancialReportPDF;
