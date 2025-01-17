import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
  checkIfTeeTimeStillListedByListingId: protectedProcedure
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
        limit: z.number().optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.serviceFactory
        .getBookingService()
        .getOwnedTeeTimes(ctx.session.user.id, input.courseId, input.limit, input.cursor);
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
          input.slots
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory.getBookingService().cancelListing(ctx.session.user.id, input.listingId);
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
        additionalNoteFromUser: z.string().max(200).optional(),
        needRentals: z.boolean(),
        redirectHref: z.string().url(),
        courseMembershipId:z.string(),
        playerCountForMemberShip:z.string(),
        providerCourseMembershipId:z.string(),
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
          input.additionalNoteFromUser,
          input.needRentals,
          input.redirectHref,
          input.courseMembershipId,
          input.playerCountForMemberShip,
          input.providerCourseMembershipId
        );
    }),
  reserveSecondHandBooking: protectedProcedure
    .input(
      z.object({
        cartId: z.string(),
        listingId: z.string(),
        payment_id: z.string(),
        additionalNoteFromUser: z.string().max(200).optional(),
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
    checkIfUserIsOptMemberShip:protectedProcedure.input(
      z.object({
        bookingId:z.string()
      })
    ).mutation(async ({ctx,input})=>{
      return ctx.serviceFactory.getBookingService().checkIfUserIsOptMemberShip(ctx.session.user.id,input.bookingId)
    })
});
