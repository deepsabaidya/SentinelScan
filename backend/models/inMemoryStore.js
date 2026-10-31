const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * SentinelScan In-Memory Fallback Store
 * Provides seamless local fallback when MongoDB Atlas is disconnected or not yet configured.
 * Guarantees zero downtime for frontend UI demonstrations, test audits, and report generation.
 */

const generateId = () => new mongoose.Types.ObjectId();

// Internal state maps
const users = new Map();
const websites = new Map();
const assessments = new Map();
const findings = new Map();
const assessmentChecks = new Map();

// Helper to simulate Mongoose document methods
function createUserDoc(data) {
  const doc = {
    _id: data._id || generateId(),
    name: data.name,
    email: data.email ? data.email.toLowerCase().trim() : '',
    passwordHash: data.passwordHash,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    async matchPassword(entered) {
      return await bcrypt.compare(entered, this.passwordHash);
    },
    toJSON() {
      const copy = { ...this };
      delete copy.passwordHash;
      return copy;
    },
    toObject() {
      return { ...this };
    },
  };
  return doc;
}

function createWebsiteDoc(data) {
  return {
    _id: data._id || generateId(),
    userId: data.userId,
    url: data.url,
    domain: data.domain,
    lastScore: data.lastScore !== undefined ? data.lastScore : null,
    lastGrade: data.lastGrade || null,
    lastAssessedAt: data.lastAssessedAt || null,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    toJSON() {
      return { ...this };
    },
    toObject() {
      return { ...this };
    },
  };
}

function createAssessmentDoc(data) {
  return {
    _id: data._id || generateId(),
    userId: data.userId,
    websiteId: data.websiteId,
    targetUrl: data.targetUrl,
    targetDomain: data.targetDomain,
    securityScore: data.securityScore || 0,
    securityGrade: data.securityGrade || 'Moderate',
    status: data.status || 'queued',
    summary: data.summary || {
      totalFindings: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
      passedChecks: 0,
      failedChecks: 0,
      warningChecks: 0,
      unableToAssess: 0,
    },
    startedAt: data.startedAt || new Date(),
    completedAt: data.completedAt || null,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    toJSON() {
      return { ...this };
    },
    toObject() {
      return { ...this };
    },
  };
}

function createFindingDoc(data) {
  return {
    _id: data._id || generateId(),
    assessmentId: data.assessmentId,
    category: data.category,
    title: data.title,
    description: data.description,
    severity: data.severity,
    evidence: data.evidence || '',
    recommendation: data.recommendation || '',
    status: data.status || 'open',
    createdAt: data.createdAt || new Date(),
    toJSON() {
      return { ...this };
    },
    toObject() {
      return { ...this };
    },
  };
}

function createCheckDoc(data) {
  return {
    _id: data._id || generateId(),
    assessmentId: data.assessmentId,
    checkName: data.checkName,
    category: data.category,
    result: data.result,
    details: data.details || {},
    createdAt: data.createdAt || new Date(),
    toJSON() {
      return { ...this };
    },
    toObject() {
      return { ...this };
    },
  };
}

// Populate helper
function populateItem(item, field, select) {
  if (!item) return item;
  const clone = { ...item };
  if (field === 'websiteId' && clone.websiteId) {
    const rawId = clone.websiteId._id ? clone.websiteId._id.toString() : clone.websiteId.toString();
    const site = websites.get(rawId);
    if (site) {
      clone.websiteId = {
        _id: site._id,
        url: site.url,
        domain: site.domain,
      };
    }
  }
  return clone;
}

// Chainable query simulation
class ChainableQuery {
  constructor(fn) {
    this._fn = fn;
    this._populates = [];
    this._sortField = null;
    this._limit = null;
  }

  populate(field, select) {
    this._populates.push({ field, select });
    return this;
  }

  sort(criteria) {
    this._sort = criteria;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  async exec() {
    let result = await this._fn();
    if (Array.isArray(result)) {
      if (this._sort) {
        result = [...result].reverse();
      }
      if (this._limit) {
        result = result.slice(0, this._limit);
      }
      for (const p of this._populates) {
        result = result.map((item) => populateItem(item, p.field, p.select));
      }
    } else if (result) {
      for (const p of this._populates) {
        result = populateItem(result, p.field, p.select);
      }
    }
    return result;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

// In-Memory Model Implementations
const MockUser = {
  findOne(query) {
    return new ChainableQuery(async () => {
      if (query.email) {
        const norm = query.email.toLowerCase().trim();
        for (const u of users.values()) {
          if (u.email === norm) return u;
        }
      }
      return null;
    });
  },

  findById(id) {
    return new ChainableQuery(async () => {
      const idStr = id ? id.toString() : '';
      return users.get(idStr) || null;
    });
  },

  async create(data) {
    const user = createUserDoc(data);
    users.set(user._id.toString(), user);
    return user;
  },

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },
};

const MockWebsite = {
  find(query = {}) {
    return new ChainableQuery(async () => {
      const list = [];
      const userStr = query.userId ? query.userId.toString() : null;
      for (const w of websites.values()) {
        if (!userStr || (w.userId && w.userId.toString() === userStr)) {
          list.push(w);
        }
      }
      return list;
    });
  },

  findOne(query) {
    return new ChainableQuery(async () => {
      const userStr = query.userId ? query.userId.toString() : null;
      const idStr = query._id ? query._id.toString() : null;

      for (const w of websites.values()) {
        const matchUser = !userStr || (w.userId && w.userId.toString() === userStr);
        const matchId = !idStr || w._id.toString() === idStr;
        const matchDomain = !query.domain || w.domain === query.domain;

        if (matchUser && matchId && matchDomain) {
          return w;
        }
      }
      return null;
    });
  },

  findById(id) {
    return new ChainableQuery(async () => {
      return websites.get(id ? id.toString() : '') || null;
    });
  },

  async create(data) {
    const site = createWebsiteDoc(data);
    websites.set(site._id.toString(), site);
    return site;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const idStr = id ? id.toString() : '';
    const site = websites.get(idStr);
    if (!site) return null;
    Object.assign(site, update);
    site.updatedAt = new Date();
    return site;
  },

  async deleteOne(query) {
    const idStr = query._id ? query._id.toString() : '';
    websites.delete(idStr);
    return { acknowledged: true, deletedCount: 1 };
  },

  async countDocuments(query = {}) {
    const userStr = query.userId ? query.userId.toString() : null;
    let count = 0;
    for (const w of websites.values()) {
      if (!userStr || (w.userId && w.userId.toString() === userStr)) {
        count++;
      }
    }
    return count;
  },
};

const MockAssessment = {
  find(query = {}) {
    return new ChainableQuery(async () => {
      const list = [];
      const userStr = query.userId ? query.userId.toString() : null;
      const siteStr = query.websiteId ? query.websiteId.toString() : null;

      for (const a of assessments.values()) {
        const matchUser = !userStr || (a.userId && a.userId.toString() === userStr);
        const matchSite = !siteStr || (a.websiteId && a.websiteId.toString() === siteStr);
        const matchStatus = !query.status || a.status === query.status;

        if (matchUser && matchSite && matchStatus) {
          list.push(a);
        }
      }
      return list;
    });
  },

  findOne(query = {}) {
    return new ChainableQuery(async () => {
      const userStr = query.userId ? query.userId.toString() : null;
      const idStr = query._id ? query._id.toString() : null;

      for (const a of assessments.values()) {
        const matchUser = !userStr || (a.userId && a.userId.toString() === userStr);
        const matchId = !idStr || a._id.toString() === idStr;
        const matchStatus = !query.status || a.status === query.status;

        if (matchUser && matchId && matchStatus) {
          return a;
        }
      }
      return null;
    });
  },

  findById(id) {
    return new ChainableQuery(async () => {
      return assessments.get(id ? id.toString() : '') || null;
    });
  },

  async create(data) {
    const doc = createAssessmentDoc(data);
    assessments.set(doc._id.toString(), doc);
    return doc;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const idStr = id ? id.toString() : '';
    const doc = assessments.get(idStr);
    if (!doc) return null;
    Object.assign(doc, update);
    doc.updatedAt = new Date();
    return doc;
  },

  async deleteMany(query = {}) {
    let count = 0;
    if (query._id && query._id.$in) {
      for (const id of query._id.$in) {
        if (assessments.delete(id.toString())) count++;
      }
    }
    return { acknowledged: true, deletedCount: count };
  },

  async countDocuments(query = {}) {
    const userStr = query.userId ? query.userId.toString() : null;
    let count = 0;
    for (const a of assessments.values()) {
      if (!userStr || (a.userId && a.userId.toString() === userStr)) {
        count++;
      }
    }
    return count;
  },
};

const MockFinding = {
  find(query = {}) {
    return new ChainableQuery(async () => {
      const list = [];
      const assessStr = query.assessmentId ? query.assessmentId.toString() : null;
      for (const f of findings.values()) {
        if (!assessStr || (f.assessmentId && f.assessmentId.toString() === assessStr)) {
          list.push(f);
        }
      }
      return list;
    });
  },

  async create(data) {
    const doc = createFindingDoc(data);
    findings.set(doc._id.toString(), doc);
    return doc;
  },

  async insertMany(array = []) {
    return array.map((item) => {
      const doc = createFindingDoc(item);
      findings.set(doc._id.toString(), doc);
      return doc;
    });
  },

  async deleteMany(query = {}) {
    let count = 0;
    if (query.assessmentId && query.assessmentId.$in) {
      const ids = new Set(query.assessmentId.$in.map((i) => i.toString()));
      for (const [key, val] of findings.entries()) {
        if (val.assessmentId && ids.has(val.assessmentId.toString())) {
          findings.delete(key);
          count++;
        }
      }
    }
    return { acknowledged: true, deletedCount: count };
  },
};

const MockAssessmentCheck = {
  find(query = {}) {
    return new ChainableQuery(async () => {
      const list = [];
      const assessStr = query.assessmentId ? query.assessmentId.toString() : null;
      for (const c of assessmentChecks.values()) {
        if (!assessStr || (c.assessmentId && c.assessmentId.toString() === assessStr)) {
          list.push(c);
        }
      }
      return list;
    });
  },

  async create(data) {
    const doc = createCheckDoc(data);
    assessmentChecks.set(doc._id.toString(), doc);
    return doc;
  },

  async insertMany(array = []) {
    return array.map((item) => {
      const doc = createCheckDoc(item);
      assessmentChecks.set(doc._id.toString(), doc);
      return doc;
    });
  },

  async deleteMany(query = {}) {
    let count = 0;
    if (query.assessmentId && query.assessmentId.$in) {
      const ids = new Set(query.assessmentId.$in.map((i) => i.toString()));
      for (const [key, val] of assessmentChecks.entries()) {
        if (val.assessmentId && ids.has(val.assessmentId.toString())) {
          assessmentChecks.delete(key);
          count++;
        }
      }
    }
    return { acknowledged: true, deletedCount: count };
  },
};

// Seed sample demo data on initialization
(async () => {
  try {
    const demoPasswordHash = await bcrypt.hash('password123', 10);
    const demoUser = createUserDoc({
      _id: new mongoose.Types.ObjectId('650000000000000000000001'),
      name: 'Deepsa Baidya',
      email: 'analyst@sentinelscan.io',
      passwordHash: demoPasswordHash,
    });
    users.set(demoUser._id.toString(), demoUser);

    const demoSite = createWebsiteDoc({
      _id: new mongoose.Types.ObjectId('650000000000000000000002'),
      userId: demoUser._id,
      url: 'https://example.com',
      domain: 'example.com',
      lastScore: 82,
      lastGrade: 'Good',
      lastAssessedAt: new Date(),
    });
    websites.set(demoSite._id.toString(), demoSite);

    const demoAssessment = createAssessmentDoc({
      _id: new mongoose.Types.ObjectId('650000000000000000000003'),
      userId: demoUser._id,
      websiteId: demoSite._id,
      targetUrl: 'https://example.com',
      targetDomain: 'example.com',
      securityScore: 82,
      securityGrade: 'Good',
      status: 'completed',
      summary: {
        totalFindings: 3,
        critical: 0,
        high: 1,
        medium: 1,
        low: 1,
        informational: 0,
        passedChecks: 14,
        failedChecks: 2,
        warningChecks: 1,
        unableToAssess: 0,
      },
      completedAt: new Date(),
    });
    assessments.set(demoAssessment._id.toString(), demoAssessment);

    const sampleFindings = [
      {
        assessmentId: demoAssessment._id,
        category: 'headers',
        title: 'Missing Content-Security-Policy (CSP)',
        description: 'No Content-Security-Policy header detected. This allows Cross-Site Scripting (XSS) and code injection.',
        severity: 'High',
        recommendation: "Implement a restrictive CSP header: Content-Security-Policy: default-src 'self'",
      },
      {
        assessmentId: demoAssessment._id,
        category: 'headers',
        title: 'Missing Permissions-Policy Header',
        description: 'Permissions-Policy header is absent. Browser hardware APIs (camera, geolocation) are not constrained.',
        severity: 'Medium',
        recommendation: 'Configure Permissions-Policy to explicitly disable unnecessary browser features.',
      },
      {
        assessmentId: demoAssessment._id,
        category: 'headers',
        title: 'Referrer-Policy Header Omitted',
        description: 'Referrer-Policy header is missing. Browsers may leak full referer URLs in cross-origin requests.',
        severity: 'Low',
        recommendation: 'Specify Referrer-Policy: strict-origin-when-cross-origin',
      },
    ];

    for (const f of sampleFindings) {
      const doc = createFindingDoc(f);
      findings.set(doc._id.toString(), doc);
    }
  } catch (err) {
    console.error('[InMemoryStore] Seed failed:', err.message);
  }
})();

module.exports = {
  MockUser,
  MockWebsite,
  MockAssessment,
  MockFinding,
  MockAssessmentCheck,
};
