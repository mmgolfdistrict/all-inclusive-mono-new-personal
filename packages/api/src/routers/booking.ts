import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const bookingRouter = createTRPCRouter({
  checkIfTeeTimeStillListed: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory.getBookingService().checkIfTeeTimeStillListed(input.bookingId);
    }),
  checkIfTeeTimeStillListedByListingId: publicProcedure
    .input(
      z.object({
        listingId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory.getBookingService().checkIfTeeTimeStillListedByListingId(input.listingId);
    }),

  getOfferReceivedForUser: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .getOfferReceivedForUser(ctx.session.user.id, input.courseId, input.limit, input.cursor);
    }),
  getMyListedTeeTime: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .getMyListedTeeTimes(ctx.session.user.id, input.courseId, input.limit, input.cursor);
    }),
  getOfferSentForUser: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .getOfferSentForUser(ctx.session.user.id, input.courseId, input.limit, input.cursor);
    }),
  getOwnedTeeTimes: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        userTime: z.string().optional(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .getOwnedTeeTimes(ctx.session.user.id, input.courseId, input.userTime, input.limit, input.cursor);
    }),
  getOffersForBooking: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .getOffersForBooking(input.bookingId, input.limit, input.cursor);
    }),
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .getTransactionHistory(ctx.session.user.id, input.courseId, input.limit, input.cursor);
    }),
  createListingForBookings: protectedProcedure
    .input(
      z.object({
        bookingIds: z.array(z.string()),
        listPrice: z.number(),
        endTime: z.date(),
        slots: z.number(),
        allowSplit: z.boolean().optional(),
        color1: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .createListingForBookings(
          ctx.session.user.id,
          input.listPrice,
          input.bookingIds,
          input.endTime,
          input.slots,
          input.allowSplit,
          input.color1
        );
    }),
  updateListingForBookings: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        updatedPrice: z.number(),
        updatedSlots: z.number(),
        bookingIds: z.array(z.string()),
        endTime: z.date(),
        allowSplit: z.boolean(),
        color1: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .updateListingForBookings(
          ctx.session.user.id,
          input.listId,
          input.updatedPrice,
          input.updatedSlots,
          input.bookingIds,
          input.endTime,
          input.allowSplit,
          input.color1
        );
    }),
  getOwnedBookingsForTeeTime: protectedProcedure
    .input(
      z.object({
        teeTimeId: z.string(),
        ownerId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .getOwnedBookingsForTeeTime(input?.ownerId ?? ctx?.session?.user?.id, input.teeTimeId);
    }),

  getOwnedBookingById: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory.getBookingService().getOwnedBookingById(ctx.session.user.id, input.bookingId);
    }),
  updateNamesOnBookings: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        usersToUpdate: z.array(
          z.object({
            id: z.string(),
            handle: z.string(),
            name: z.string(),
            email: z.string(),
            slotId: z.string(),
            bookingId: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .updateNamesOnBookings(ctx.session.user.id, input.usersToUpdate, input.bookingId);
    }),
  updateListing: protectedProcedure
    .input(
      z.object({
        bookingIds: z.array(z.string()),
        listPrice: z.number(),
        listingId: z.string(),
        endTime: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .updateListing(
          ctx.session.user.id,
          input.listPrice,
          input.bookingIds,
          input.endTime,
          input.listingId
        );
    }),
  createOfferOnBookings: protectedProcedure
    .input(
      z.object({
        bookingIds: z.array(z.string()),
        price: z.number(),
        expiresAt: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .createOfferOnBookings(ctx.session.user.id, input.bookingIds, input.price, input.expiresAt);
    }),
  cancelOffer: protectedProcedure
    .input(
      z.object({
        offerId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory.getBookingService().cancelOfferOnBooking(ctx.session.user.id, input.offerId);
    }),
  cancelListing: protectedProcedure
    .input(
      z.object({
        listingId: z.string(),
        color1: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .cancelListing(ctx.session.user.id, input.listingId, input.color1);
    }),
  acceptOffer: protectedProcedure
    .input(
      z.object({
        offerId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory.getBookingService().acceptOffer(ctx.session.user.id, input.offerId);
    }),
  rejectOffer: protectedProcedure
    .input(
      z.object({
        offerId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory.getBookingService().rejectOffer(ctx.session.user.id, input.offerId);
    }),
  setMinimumOfferPrice: protectedProcedure
    .input(
      z.object({
        teeTimeId: z.string(),
        minimumOfferPrice: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .setMinimumOfferPrice(ctx.session.user.id, input.teeTimeId, input.minimumOfferPrice);
    }),
  teeTimeHasEnoughFirstHandSpots: protectedProcedure
    .input(
      z.object({
        teeTimeId: z.string(),
        spots: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory.getBookingService().teeTimeAvailableFirsthandSpots(input.teeTimeId);
    }),
  reserveBooking: protectedProcedure
    .input(
      z.object({
        cartId: z.string(),
        payment_id: z.string(),
        sensibleQuoteId: z.string(),
        source: z.string(),
        additionalNoteFromUser: z.string().max(150).optional(),
        needRentals: z.boolean(),
        redirectHref: z.string().url(),
        courseMembershipId: z.string().optional(),
        playerCountForMemberShip: z.string().optional(),
        providerCourseMembershipId: z.string().optional(),
        color1: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .reserveBooking(
          ctx.session.user.id,
          input.cartId,
          input.payment_id,
          input.sensibleQuoteId,
          input.source,
          input.additionalNoteFromUser,
          input.needRentals,
          input.redirectHref,
          input.courseMembershipId ?? "",
          input.playerCountForMemberShip ?? "",
          input.providerCourseMembershipId ?? "",
          input.color1
        );
    }),
  reserveSecondHandBooking: protectedProcedure
    .input(
      z.object({
        cartId: z.string(),
        listingId: z.string(),
        payment_id: z.string(),
        source: z.string(),
        additionalNoteFromUser: z.string().max(150).optional(),
        needRentals: z.boolean(),
        redirectHref: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .reserveSecondHandBooking(
          ctx.session.user.id,
          input.cartId,
          input.listingId,
          input.payment_id,
          input.source,
          input.additionalNoteFromUser,
          input.needRentals,
          input.redirectHref
        );
    }),
  checkIfTeeTimeAvailableOnProvider: protectedProcedure
    .input(
      z.object({
        teeTimeId: z.string(),
        golfersCount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .checkIfTeeTimeAvailableOnProvider(input.teeTimeId, input.golfersCount, ctx.session.user.id);
    }),
  checkIfUserIsOptMemberShip: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .checkIfUserIsOptMemberShip(ctx.session.user.id, input.bookingId);
    }),
  providerBookingStatus: protectedProcedure
    .input(
      z.object({
        listingId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .checkCancelledBookingFromProvider(input.listingId, ctx.session.user.id);
    }),
  checkIfTeeTimeGroupAvailableOnProvider: protectedProcedure
    .input(
      z.object({
        teeTimeIds: z.string().array(),
        golfersCount: z.number(),
        minimumPlayersPerBooking: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .checkIfTeeTimeGroupAvailableOnProvider(
          input.teeTimeIds,
          input.golfersCount,
          input.minimumPlayersPerBooking,
          ctx.session.user.id
        );
    }),
  reserveGroupBooking: protectedProcedure
    .input(
      z.object({
        cartId: z.string(),
        payment_id: z.string(),
        sensibleQuoteId: z.string(),
        source: z.string(),
        additionalNoteFromUser: z.string().max(150).optional(),
        needRentals: z.boolean(),
        redirectHref: z.string().url(),
        courseMembershipId: z.string().optional(),
        playerCountForMemberShip: z.string().optional(),
        providerCourseMembershipId: z.string().optional(),
        color1: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .reserveGroupBooking(
          ctx.session.user.id,
          input.cartId,
          input.payment_id,
          input.sensibleQuoteId,
          input.source,
          input.additionalNoteFromUser,
          input.needRentals,
          input.redirectHref,
          input.courseMembershipId ?? "",
          input.playerCountForMemberShip ?? "",
          input.providerCourseMembershipId ?? "",
          input.color1
        );
    }),
  createListingForGroupBookings: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        listPrice: z.number(),
        endTime: z.date(),
        slots: z.number(),
        color1: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .createListingForGroupBookings(
          ctx.session.user.id,
          input.listPrice,
          input.groupId,
          input.endTime,
          input.slots,
          input.color1
        );
    }),
  cancelGroupListing: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        color1: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .cancelGroupListing(ctx.session.user.id, input.groupId, input.color1);
    }),
});
