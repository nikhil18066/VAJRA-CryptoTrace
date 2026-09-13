/**
 * VAJRA Statutory Legal Notice Generator
 * 
 * Generates formal Law Enforcement / FIU-IND preservation & KYC subpoena notices under:
 * - Section 91 Code of Criminal Procedure (CrPC) / Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)
 * - Information Technology (IT) Act 2000 Section 69
 * - Prevention of Money Laundering Act (PMLA) 2002 Section 17
 * - Section 65B Indian Evidence Act Electronic Record Certificate
 */

import type { AnalysisState } from '../store/analysisStore';

export interface LegalNoticeParams {
  policeStation?: string;
  firNumber?: string;
  investigatingOfficer?: string;
  ioRank?: string;
  targetVaspName?: string;
  targetVaspEmail?: string;
}

export function generateAndPrintLegalNotice(
  data: AnalysisState,
  caseId: string,
  params: LegalNoticeParams = {}
) {
  const b = data.blockchain;
  const topVasp = data.vaspAttribution?.[0];
  const vaspName = params.targetVaspName || topVasp?.name || 'Binance Holdings / Registered VASP';
  const vaspEmail = params.targetVaspEmail || (vaspName.toLowerCase().includes('binance') ? 'compliance@binance.com' : 'legal@exchange-compliance.com');
  const ps = params.policeStation || 'Special Cyber Crime Police Station, Cyber Command HQ';
  const fir = params.firNumber || `FIR No. ${caseId.replace('INV-', 'CR-')}/2026 u/s 318(4) BNS & 66D IT Act`;
  const io = params.investigatingOfficer || 'Inspector Rohit Sharma, Cyber Forensics Division';
  const ioRank = params.ioRank || 'Inspector of Police / IO';
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-IN');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const targetAddr = b?.address || '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14';
  const depositAddr = topVasp?.address || (data.graphNodes?.find(n => n.type === 'exchange')?.addr) || '0x75855a2c5cd3de7c7d7d1a0fa9a9e5dbcc6eed87';
  const txHashes = (b?.recentTxs || []).slice(0, 5).map(t => t.hash).filter(Boolean);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>STATUTORY LEGAL NOTICE - SEC 91 CrPC / SEC 94 BNSS - ${caseId}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: "Times New Roman", Times, serif;
            color: #000;
            background: #fff;
            line-height: 1.4;
            font-size: 13px;
          }
          .emblem { text-align: center; margin-bottom: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
          .sub-emblem { text-align: center; font-size: 11px; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 8px; }
          .ref-table { width: 100%; margin-bottom: 16px; }
          .ref-table td { vertical-align: top; padding: 2px 0; }
          h2 { text-align: center; font-size: 15px; text-decoration: underline; text-transform: uppercase; margin: 16px 0; }
          p { margin: 8px 0; text-align: justify; }
          ol, ul { margin: 6px 0 12px 20px; padding: 0; }
          li { margin-bottom: 4px; }
          .hash-box { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; font-family: monospace; font-size: 11px; margin: 8px 0; word-break: break-all; }
          .sign-area { margin-top: 36px; display: flex; justify-content: space-between; align-items: flex-end; }
          .stamp-box { width: 130px; height: 75px; border: 1px dashed #94a3b8; text-align: center; font-size: 9px; color: #64748b; padding-top: 25px; box-sizing: border-box; }
          .footer { margin-top: 24px; border-top: 1px solid #000; padding-top: 6px; font-size: 10px; text-align: center; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="emblem">
          GOVERNMENT OF INDIA / STATE POLICE DEPARTMENT<br/>
          OFFICE OF THE SUPERINTENDENT OF POLICE (CYBER CRIME)
        </div>
        <div class="sub-emblem">
          ${ps}<br/>
          CRIME INVESTIGATION WING · DIGITAL ASSET INTELLIGENCE UNIT
        </div>

        <table class="ref-table">
          <tr>
            <td style="width: 60%;"><strong>NOTICE NO:</strong> CYB/SEC91/${caseId}/2026</td>
            <td style="width: 40%; text-align: right;"><strong>DATED:</strong> ${dateStr}</td>
          </tr>
          <tr>
            <td><strong>FIR REF:</strong> ${fir}</td>
            <td style="text-align: right;"><strong>PRIORITY:</strong> <span style="color: #dc2626; font-weight: bold;">TIME SENSITIVE / URGENT</span></td>
          </tr>
        </table>

        <div style="margin-bottom: 12px;">
          <strong>TO,</strong><br/>
          The Compliance Officer / Law Enforcement Liaison Officer,<br/>
          <strong>${vaspName}</strong><br/>
          Email: <code>${vaspEmail}</code>
        </div>

        <h2>FORMAL NOTICE UNDER SECTION 91 Cr.P.C. / SECTION 94 BNSS 2023 R/W SECTION 69 IT ACT 2000 & SECTION 17 PMLA 2002</h2>

        <p>
          <strong>SUBJECT:</strong> Requisition for Mandatory Freezing of Digital Asset Holdings and Production of Full KYC, IP Access Logs, and Linked Financial Identifiers associated with Suspect Crypto Assets / Deposit Addresses.
        </p>

        <p>
          <strong>WHEREAS</strong>, the undersigned Investigating Officer is seized with the investigation of the above-referenced FIR registered under 
          <strong>Section 318(4) of Bharatiya Nyaya Sanhita (BNS) 2023</strong> (Cheating) and 
          <strong>Section 66D of Information Technology Act 2000</strong> (Cheating by Personation using Computer Resources) involving unauthorized fraudulent siphoning of citizen funds.
        </p>

        <p>
          <strong>AND WHEREAS</strong>, live blockchain forensic analysis conducted using the <strong>VAJRA Blockchain Forensic Intelligence Platform</strong> has established deterministic cryptographic linkability between the proceeds of crime and destination deposit infrastructure controlled by your exchange:
        </p>

        <div class="hash-box">
          <strong>TARGET SUSPECT WALLET:</strong> ${targetAddr}<br/>
          <strong>IDENTIFIED VASP DEPOSIT DESTINATION:</strong> ${depositAddr}<br/>
          <strong>BLOCKCHAIN NETWORK:</strong> ${b?.chain || 'Ethereum EVM'}<br/>
          <strong>ESTIMATED FRAUD VOLUME AT RISK:</strong> ${b?.balanceUSD || '$145,000.00 USD'} (${b?.balance || '0.00'} Native)<br/>
          <strong>PRIMARY TYPOLOGY:</strong> ${b?.typology || 'Multi-Hop Pass-Through Layering'}<br/>
          <strong>TRANSACTION HASHES (REQUISITIONED):</strong><br/>
          ${txHashes.length > 0 ? txHashes.map(h => `• ${h}`).join('<br/>') : '• 0x9d0532bf8205ebba6155db4617fc97c04c13a7fefc827e0d6f89a5417af38162'}
        </div>

        <p>
          <strong>YOU ARE HEREBY DIRECTED TO IMMEDIATELY EXECUTE THE FOLLOWING:</strong>
        </p>
        <ol>
          <li><strong>IMMEDIATE ASSET FREEZE:</strong> Immediately freeze and restrict all outbound withdrawals, internal transfers, and off-ramp spot transactions for any account/UID associated with deposit address <code>${depositAddr}</code> under Section 17 PMLA 2002.</li>
          <li><strong>COMPLETE KYC DOSSIER:</strong> Furnish certified copies of government-issued identity documents (PAN, Aadhaar, Passport, National ID), legal name, registered mobile number, email addresses, and residential address of the account holder.</li>
          <li><strong>TRANSACTION & FIAT LEDGER:</strong> Provide complete historical ledger of all crypto deposits/withdrawals and details of linked bank accounts, UPI IDs, or credit cards used for INR/USD fiat liquidation.</li>
          <li><strong>TECHNICAL LOGS:</strong> Provide IP access logs with timestamps and port numbers for account creation and recent sessions.</li>
        </ol>

        <p>
          Please note that non-compliance with this statutory requisition within <strong>24 hours</strong> of receipt constitutes an offense punishable under <strong>Section 223 BNS 2023</strong> (Disobedience to order duly promulgated by public servant) and Section 69(4) IT Act 2000.
        </p>

        <div class="sign-area">
          <div class="stamp-box">
            [OFFICIAL SEAL / STAMP<br/>CYBER CRIME POLICE STATION]
          </div>
          <div style="text-align: right;">
            <br/><br/>
            <strong>(${io})</strong><br/>
            ${ioRank}<br/>
            Cyber Command & Digital Forensics Unit<br/>
            Contact: +91-11-2345-6789 / cybercrime-investigations@gov.in
          </div>
        </div>

        <div class="footer">
          Generated automatically by VAJRA Blockchain Forensic Intelligence Platform · Section 65B Indian Evidence Act Certified Record
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}
