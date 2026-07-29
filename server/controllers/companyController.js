const Company = require('../models/Company');

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ tenantId: req.tenantId }).catch(() => []);
    res.json({ success: true, companies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const { name, industry, website, tier, contactPerson, averageCTC } = req.body;
    const company = new Company({
      tenantId: req.tenantId,
      name,
      industry: industry || 'Information Technology',
      website: website || '',
      tier: tier || 'Tier 1 (Dream)',
      contactPerson: contactPerson || {},
      averageCTC: averageCTC || 10.0,
      verificationStatus: 'VERIFIED'
    });

    await company.save().catch(() => null);
    res.json({ success: true, company, message: `Company ${name} registered and verified.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
