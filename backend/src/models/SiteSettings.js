const mongoose = require("mongoose");

const hoursRowSchema = new mongoose.Schema(
  {
    label: String,
    value: String,
    className: String,
  },
  { _id: false },
);

const siteSettingsSchema = new mongoose.Schema(
  {
    header: {
      brandName: String,
      logoImage: String,
      hoursText: String,
      addressText: String,
      phoneText: String,
      phoneHref: String,
    },
    hero: {
      title: String,
      subtitle: String,
      description: String,
      ctaPrimaryText: String,
      ctaPrimaryHref: String,
      ctaSecondaryText: String,
      ctaSecondaryHref: String,
      image: String,
    },
    about: {
      title: String,
      eyebrow: String,
      text: String,
      coverImage: String,
      characterImage: String,
      carouselImages: [String],
      highlights: [String],
      ratingCard: {
        value: String,
        label: String,
        description: String,
      },
      paymentCard: {
        title: String,
        subtitle: String,
        methods: [String],
      },
    },
    services: {
      title: String,
      subtitle: String,
    },
    gallery: {
      title: String,
      subtitle: String,
      logoImage: String,
      instagramUrl: String,
      instagramHandle: String,
      images: [String],
    },
    contact: {
      title: String,
      addressText: String,
      phoneText: String,
      phoneHref: String,
      mapEmbedUrl: String,
    },
    hoursRows: [hoursRowSchema],
    cta: {
      title: String,
      text: String,
      buttonText: String,
      buttonHref: String,
    },
    footerText: String,
    loaderText: String,
    loaderImage: String,
    barberCards: {
      barber1Name: String,
      barber1Role: String,
      barber1Description: String,
      barber1Image: String,
      barber1CoverImage: String,
      barber1LunchBreak: {
        enabled: { type: Boolean, default: false },
        startTime: String,
        endTime: String,
      },
      barber2Name: String,
      barber2Role: String,
      barber2Description: String,
      barber2Image: String,
      barber2CoverImage: String,
      barber2LunchBreak: {
        enabled: { type: Boolean, default: false },
        startTime: String,
        endTime: String,
      },
    },
    showcase: {
      cards: [
        {
          images: [String],
        },
      ],
    },
    staffSection: {
      title: String,
      subtitle: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
