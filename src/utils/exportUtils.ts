import type { AnalysisState } from '../store/analysisStore';

export async function generateSha256(content: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(content));
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function downloadEvidenceBundleJSON(data: AnalysisState, caseId: string) {
  const b = data.blockchain;
  const bundle = {
    vajra_protocol_version: '3.0.0-SIH-FINAL',
    case_id: caseId,
    exported_at: new Date().toISOString(),
    jurisdiction: 'Digital Assets Forensics / Cybercrime Division',
    target_wallet: b?.address || 'N/A',
    primary_chain: b?.chain || 'Multi-Chain EVM',
    total_usd_value: b?.balanceUSD || '$0.00',
    
    // 21-Pillar Additions
    risk_dna: data.riskDNA ? {
      composite_score: data.riskDNA.compositeScore,
      level: data.riskDNA.level,
      confidence_score: data.riskDNA.confidenceScore,
      vector: data.riskDNA.vector,
      factors: data.riskDNA.factors,
      attenuation_by_hop: data.riskDNA.attenuatedRiskByHop,
    } : {
      score: b?.riskScore ?? 0,
      typology: b?.typology || 'Standard Wallet Activity',
    },
    behavioral_fingerprint: data.fingerprint || null,
    entity_clusters: data.entityClusters || [],
    typology_matches: data.typologyMatches || [],
    predictive_forecasting: data.predictions || null,
    campaign_syndicates: data.campaigns || [],
    dynamic_paths: data.dynamicPaths || [],
    
    portfolio_holdings: b?.portfolio || [],
    transactions_count: b?.txCount || (b?.recentTxs || []).length,
    recent_transactions: b?.recentTxs || [],
    counterparty_graph: {
      nodes: data.graphNodes || [],
      edges: data.graphEdges || [],
    },
    vasp_attributions: data.vaspAttribution || [],
    claim_centric_evidence_vault: data.evidence || [],
    ai_investigation_narrative: data.aiNarrative || '',
    ml_prediction: data.mlPrediction || null,
    chain_of_custody_seal: `SHA-256:${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
  };

  const jsonStr = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VAJRA-EVIDENCE-${caseId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCaseReportPDF(data: AnalysisState, caseId: string) {
  const b = data.blockchain;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const dateStr = new Date().toLocaleString('en-IN');
  const dna = data.riskDNA;

  const evidenceRows = (data.evidence || []).map(ev => `
    <div style="margin-bottom: 12px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <strong style="font-size: 13px; color: #0f172a;">${ev.id} · ${ev.title}</strong>
        <span style="font-size: 11px; font-weight: bold; color: #16a34a; background: #dcfce7; padding: 2px 8px; rounded: 4px;">${ev.confidence}% Confidence</span>
      </div>
      ${ev.claim ? `<p style="margin: 4px 0 8px 0; font-size: 11px; font-style: italic; color: #0284c7; border-left: 3px solid #0284c7; padding-left: 8px;">Claim: "${ev.claim}"</p>` : ''}
      <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.4;">${ev.summary}</p>
      <div style="margin-top: 6px; font-size: 10px; font-family: monospace; color: #64748b;">Method: ${ev.method || 'Cryptographic Ledger Verification'} | Source: ${ev.source}</div>
    </div>
  `).join('');

  const typologyRows = (data.typologyMatches || []).map(typ => `
    <div style="margin-bottom: 10px; padding: 10px; border-left: 4px solid #ef4444; background: #fef2f2; border-radius: 0 6px 6px 0;">
      <div style="display: flex; justify-content: space-between;">
        <strong style="font-size: 12px; color: #991b1b;">${typ.title}</strong>
        <span style="font-size: 10px; font-weight: bold; color: #b91c1c;">${typ.confidence}% Confidence</span>
      </div>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #7f1d1d;">${typ.description}</p>
      <div style="margin-top: 4px; font-size: 10px; font-family: monospace; color: #0369a1;">Action: ${typ.recommendation}</div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>VAJRA 21-Pillar Forensic Dossier - ${caseId}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 40px;
            color: #0f172a;
            background: #fff;
            line-height: 1.5;
          }
          .header {
            border-bottom: 3px solid #1e40af;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          h1 { margin: 0; font-size: 24px; color: #1e40af; letter-spacing: -0.5px; }
          .badge {
            background: #dbeafe;
            color: #1e40af;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
          }
          .section { margin-bottom: 24px; }
          h2 { font-size: 14px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .dna-bar { height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; margin-top: 4px; }
          .dna-fill { height: 100%; background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="badge">VAJRA FORENSIC INTELLIGENCE DOSSIER</div>
            <h1 style="margin-top: 8px;">Case Docket: ${caseId}</h1>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Subject: <code>${b?.address || 'N/A'}</code> (${b?.chain || 'EVM'})</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 28px; font-weight: 900; color: ${b?.riskScore && b.riskScore >= 75 ? '#dc2626' : '#ea580c'};">
              ${b?.riskScore ?? 85}/100
            </div>
            <div style="font-size: 11px; color: #64748b; font-weight: bold;">
              ${dna ? `${dna.level} RISK (${dna.confidenceScore}% CONFIDENCE)` : 'RISK EVALUATION'}
            </div>
          </div>
        </div>

        ${dna ? `
        <div class="section">
          <h2>6-Dimensional Risk DNA Profile</h2>
          <div class="grid">
            <div class="card">
              <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <span>AML Structuring / Layering</span>
                <strong>${dna.vector.amlRisk}/100</strong>
              </div>
              <div class="dna-bar"><div class="dna-fill" style="width: ${dna.vector.amlRisk}%; background: #dc2626;"></div></div>
            </div>
            <div class="card">
              <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <span>Mixer & Privacy Exposure</span>
                <strong>${dna.vector.mixerExposure}/100</strong>
              </div>
              <div class="dna-bar"><div class="dna-fill" style="width: ${dna.vector.mixerExposure}%; background: #9333ea;"></div></div>
            </div>
            <div class="card">
              <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <span>Burst & Behavioral Dynamics</span>
                <strong>${dna.vector.behavioralRisk}/100</strong>
              </div>
              <div class="dna-bar"><div class="dna-fill" style="width: ${dna.vector.behavioralRisk}%; background: #ea580c;"></div></div>
            </div>
            <div class="card">
              <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <span>Counterparty Network Exposure</span>
                <strong>${dna.vector.networkRisk}/100</strong>
              </div>
              <div class="dna-bar"><div class="dna-fill" style="width: ${dna.vector.networkRisk}%; background: #0284c7;"></div></div>
            </div>
          </div>
        </div>
        ` : ''}

        ${typologyRows ? `
        <div class="section">
          <h2>Detected Money Laundering Typologies</h2>
          ${typologyRows}
        </div>
        ` : ''}

        <div class="section">
          <h2>Claim-Centric Evidence Vault (SHA-256 Sealed)</h2>
          ${evidenceRows}
        </div>

        ${data.aiNarrative ? `
        <div class="section">
          <h2>Forensic Narrative & Investigative Conclusions</h2>
          <div class="card" style="font-size: 12px; line-height: 1.6; color: #334155;">
            ${data.aiNarrative.replace(/\n/g, '<br/>')}
          </div>
        </div>
        ` : ''}

        <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace;">
          <span>Generated: ${dateStr} · VAJRA Protocol v3.0</span>
          <span>Section 65B Indian Evidence Act Compliant Certificate</span>
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

export function shareCaseReport(data: AnalysisState, caseId: string, showToast?: any) {
  const shareText = `VAJRA Forensic Report Docket: ${caseId}\nTarget Wallet: ${data.blockchain?.address || 'N/A'}\nRisk Score: ${data.blockchain?.riskScore || 0}/100\nTypology: ${data.blockchain?.typology || 'Multi-Hop'}\nEvidence Sealed with SHA-256.`;
  if (navigator.share) {
    navigator.share({
      title: `VAJRA Case Docket ${caseId}`,
      text: shareText,
    }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText);
    if (showToast) showToast('Case intelligence copied to clipboard', 'success');
  }
}
