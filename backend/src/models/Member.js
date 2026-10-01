/**
 * Member Data Model & Normalization Utility
 */

export function parseOid(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.$oid) return val.$oid;
  if (typeof val === 'object' && val._id) return parseOid(val._id);
  return String(val);
}

export function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof val === 'object' && val.$date) {
    const d = new Date(val.$date);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (val instanceof Date) return val.toISOString();
  return null;
}

export function cleanStr(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return val.trim();
  return '';
}

export function cleanArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') return item.trim();
    return item;
  }).filter(Boolean);
}

/**
 * Normalizes raw JSON member record into application-friendly schema
 */
export function normalizeMemberRecord(raw) {
  const id = parseOid(raw._id) || `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Basic Info
  const basic = raw.basic || {};
  const salutation = cleanStr(basic.salutation);
  const name = cleanStr(basic.name) || 'Anonymous Member';
  const gender = cleanStr(basic.gender);
  const dateOfBirth = parseDate(basic.dateofbirth);
  const label = cleanStr(basic.label);
  const email = cleanStr(basic.email_id).toLowerCase();
  const alternateEmail = cleanStr(basic.alternate_email_id).toLowerCase();
  const profileUpdatedOn = parseDate(basic.profile_updated_on);

  const rawLinks = basic.profile_links || {};
  const profileLinks = {
    facebook: cleanStr(rawLinks.facebook),
    linkedin: cleanStr(rawLinks.linkedin),
    twitter: cleanStr(rawLinks.twitter),
    website: cleanStr(rawLinks.website),
    youtube: cleanStr(rawLinks.youtube),
    instagram: cleanStr(rawLinks.instagram)
  };

  // Pictures
  const pictures = raw.pictures || {};
  const profileImage = cleanStr(pictures.profile) || cleanStr(pictures.full);
  const thumbnailImage = cleanStr(pictures.thumb) || profileImage;
  const fullImage = cleanStr(pictures.full) || profileImage;

  // Membership Details
  const rawMembership = Array.isArray(raw.membership_details) ? raw.membership_details : [];
  const membershipDetails = rawMembership.map(m => ({
    siteId: cleanStr(m.site_id),
    status: cleanStr(m.status) || 'Pending',
    registeredOn: parseDate(m.registered_on),
    approvedOn: parseDate(m.approved_on),
    adminNote: cleanStr(m.admin_note),
    details: Array.isArray(m.details) ? m.details.map(d => ({
      relation: cleanStr(d.relation),
      rollNo: cleanStr(d.roll_no),
      course: cleanStr(d.course),
      stream: cleanStr(d.stream),
      entity: cleanStr(d.entity),
      startYear: parseInt(d.start_year) || null,
      startMonth: parseInt(d.start_month) || null,
      endYear: parseInt(d.end_year) || null,
      endMonth: parseInt(d.end_month) || null
    })) : []
  }));

  // Education Details
  const rawEducation = Array.isArray(raw.education_details) ? raw.education_details : [];
  const educationDetails = rawEducation.map(e => ({
    course: cleanStr(e.course),
    stream: cleanStr(e.stream),
    institution: cleanStr(e.institution),
    startYear: parseInt(e.start_year) || null,
    endYear: parseInt(e.end_year) || null,
    siteId: cleanStr(e.site_id)
  }));

  // Professional Details
  const rawProf = raw.professional_details || {};
  const professionalDetails = {
    experienceYears: parseFloat(rawProf.experience_years) || 0,
    skills: cleanArray(rawProf.skills),
    industries: cleanArray(rawProf.industries),
    roles: cleanArray(rawProf.roles)
  };

  // Work Details
  const rawWork = Array.isArray(raw.work_details) ? raw.work_details : [];
  const workDetails = rawWork.map(w => ({
    company: cleanStr(w.name) || cleanStr(w.current_company),
    position: cleanStr(w.position),
    department: cleanStr(w.department),
    startYear: parseInt(w.start_year) || null,
    startMonth: parseInt(w.start_month) || null,
    endYear: parseInt(w.end_year) || null,
    endMonth: parseInt(w.end_month) || null,
    currentCompany: Boolean(w.current_company)
  }));

  // Contact Details
  const rawContact = raw.contact_details || {};
  const rawLoc = rawContact.current_location || {};
  const contactDetails = {
    mobile: cleanStr(rawContact.mobile),
    home: cleanStr(rawContact.home),
    office: cleanStr(rawContact.office),
    currentLocation: {
      location: cleanStr(rawLoc.location),
      city: cleanStr(rawLoc.city),
      country: cleanStr(rawLoc.country)
    },
    address: Array.isArray(rawContact.address) ? rawContact.address.map(a => ({
      type: cleanStr(a.type),
      address: cleanStr(a.address),
      city: cleanStr(a.city),
      state: cleanStr(a.state),
      country: cleanStr(a.country),
      pincode: cleanStr(a.pincode)
    })) : []
  };

  // Member Roles & Other
  const memberRoles = cleanArray(raw.member_roles);
  const other = Array.isArray(raw.other) ? raw.other.map(o => ({
    key: cleanStr(o.key),
    value: cleanStr(o.value)
  })).filter(o => o.key || o.value) : [];

  // Helper top-level fields for fast search/filter
  const primaryEdu = educationDetails[0] || (membershipDetails[0]?.details[0] ? {
    course: membershipDetails[0].details[0].course,
    stream: membershipDetails[0].details[0].stream,
    endYear: membershipDetails[0].details[0].endYear
  } : {});

  const primaryWork = workDetails.find(w => w.currentCompany) || workDetails[0] || {};

  const stream = primaryEdu.stream || (label.includes(',') ? label.split(',')[1]?.trim() : '') || 'General';
  const course = primaryEdu.course || (label.includes(' ') ? label.split(' ')[0]?.trim() : '') || 'Graduate';
  const endYear = primaryEdu.endYear || (label.match(/\b(20\d\d|19\d\d)\b/) ? parseInt(label.match(/\b(20\d\d|19\d\d)\b/)[0]) : null);
  const city = contactDetails.currentLocation.city || contactDetails.currentLocation.location || 'Unknown';
  const company = primaryWork.company || 'Not Specified';
  const position = primaryWork.position || 'Alumni';

  return {
    _id: id,
    id: id,
    basic: {
      salutation,
      name,
      gender,
      dateOfBirth,
      label,
      email,
      alternateEmail,
      profileUpdatedOn,
      profileLinks
    },
    pictures: {
      profile: profileImage,
      thumb: thumbnailImage,
      full: fullImage
    },
    membershipDetails,
    educationDetails,
    professionalDetails,
    workDetails,
    contactDetails,
    memberRoles,
    other,
    // Flat attributes for quick indexing & search
    searchHelper: {
      name,
      email,
      course,
      stream,
      endYear,
      city,
      company,
      position,
      skills: professionalDetails.skills,
      membershipStatus: membershipDetails[0]?.status || 'Active'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Strips sensitive contact info for public consumption
 */
export function toPublicMemberRecord(member) {
  if (!member) return null;
  const clone = JSON.parse(JSON.stringify(member));

  if (clone.contactDetails) {
    delete clone.contactDetails.mobile;
    delete clone.contactDetails.home;
    delete clone.contactDetails.office;
    delete clone.contactDetails.address;
  }
  if (clone.basic) {
    delete clone.basic.email;
    delete clone.basic.alternateEmail;
    delete clone.basic.dateOfBirth;
  }

  return clone;
}
