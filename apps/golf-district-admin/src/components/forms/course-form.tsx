import { useState } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Clock } from "../icons/clock";
import { DollarSign } from "../icons/dollar-sign";
import { Checkbox } from "../input/checkbox";
import { DropMedia } from "../input/drop-media";
import { Input } from "../input/input";
import { Select } from "../input/select";
import { Switch } from "../input/switch";
import { Textarea } from "../input/textarea";
import { Wrapper } from "./wrapper";

const charities = ["Charity 1", "Charity 2", "Charity 3", "Charity 4"];

export const CourseForm = ({
  isEdit,
  onClose,
}: {
  isEdit?: boolean;
  onClose: () => void;
}) => {
  const [status, setStatus] = useState<string>("Active");
  const [allowsCharities, setAllowsCharities] = useState<boolean>(false);

  return (
    <Wrapper>
      <form className="flex flex-col gap-4 text-[14px] items-center">
        <div className="flex w-full justify-between gap-2 items-center">
          <h1 className="font-500 text-[24px]">
            {isEdit ? "Edit" : "New"} Course
          </h1>
          <div className="flex items-center gap-2">
            <OutlineButton className="min-w-[90px]">Preview</OutlineButton>
            <OutlineButton className="min-w-[90px]" onClick={onClose}>
              Cancel
            </OutlineButton>
            <FilledButton className="min-w-[90px]">Save</FilledButton>
          </div>
        </div>
        <section className="flex flex-col gap-2 w-full max-w-[600px] mt-2 pb-10">
          <div className="flex items-end gap-2">
            <Input
              name="ID"
              register={() => undefined}
              className="w-full"
              isReadOnly={true}
              label="ID"
              defaultValue={"1234"}
            />
            <Select
              values={["Active", "Inactive"]}
              value={status}
              setValue={setStatus}
              label="Status"
              placeholder="Select Status"
            />
          </div>
          <Input
            name="courseName"
            register={() => undefined}
            className="w-full"
            label="Name"
            placeholder="Enter course name"
          />
          <Select
            values={["ABC Resort"]}
            value={""}
            setValue={() => undefined}
            label="Management Company"
            placeholder="Select a management company"
          />

          <section className="w-full flex flex-col gap-1 pt-2 text-primary-gray mt-4">
            <p className="text-black text-[18px]">Address & Website</p>
            <Input
              name="website"
              register={() => undefined}
              className="w-full"
              label="Website"
              placeholder="Enter course website"
            />
            <div className="flex items-end gap-2">
              <Input
                name="address1"
                register={() => undefined}
                className="w-full"
                label="Address 1"
                placeholder="Enter course address 1"
              />
              <Input
                name="address2"
                register={() => undefined}
                className="w-full"
                label="Address 2"
                placeholder="Enter course address 2"
              />
            </div>
            <div className="flex items-end gap-2">
              <Input
                name="city"
                register={() => undefined}
                className="w-full"
                label="City"
                placeholder="Enter course city"
              />
              <Select
                values={["Utah"]}
                value={""}
                setValue={() => undefined}
                label="State"
                placeholder="Select a state"
              />
              <Input
                name="zip"
                register={() => undefined}
                className="w-full"
                label="Zip"
                placeholder="Enter course zip code"
              />
            </div>
          </section>

          <section className="w-full flex flex-col gap-1 pt-2 text-primary-gray mt-4">
            <p className="text-black text-[18px]">Contact</p>
            <div className="flex items-end gap-2">
              <Input
                name="contactFirstName"
                register={() => undefined}
                className="w-full"
                label="Contact First Name"
                placeholder="Enter course contact first name"
              />
              <Input
                name="contactLastName"
                register={() => undefined}
                className="w-full"
                label="Contact Last Name"
                placeholder="Enter course contact last name"
              />
            </div>
            <Input
              name="contactPosition"
              register={() => undefined}
              className="w-full"
              label="Contact Position"
              placeholder="Enter course contact position"
            />
            <div className="flex items-end gap-2">
              <Input
                name="contactPhone"
                register={() => undefined}
                className="w-full"
                label="Contact Phone"
                placeholder="Enter course contact phone"
                type="tel"
              />
              <Input
                name="contactEmail"
                register={() => undefined}
                className="w-full"
                label="Contact Email"
                placeholder="Enter course contact email"
                type="email"
              />
            </div>
          </section>

          <section className="w-full flex flex-col gap-1 pt-2 text-primary-gray mt-4">
            <p className="text-black text-[18px]">Course Details</p>
            <div className="flex items-end gap-2">
              <Select
                values={["9", "18"]}
                value={""}
                setValue={() => undefined}
                label="Hole"
                placeholder="Select number of holes"
              />
              <Input
                name="par"
                register={() => undefined}
                className="w-full"
                label="Par"
                placeholder="Enter course par"
              />
            </div>
            <div className="flex items-end gap-2">
              <Input
                name="length"
                register={() => undefined}
                className="w-full"
                label="Length"
                placeholder="Enter course length"
                type="number"
              />
              <Input
                name="slope"
                register={() => undefined}
                className="w-full"
                label="Slope"
                placeholder="Enter course slope"
                type="number"
              />
            </div>
            <div className="flex items-end gap-2">
              <Input
                name="rating"
                register={() => undefined}
                className="w-full"
                label="Rating"
                placeholder="Enter course rating"
                type="number"
              />
              <Input
                name="yearBuilt"
                register={() => undefined}
                className="w-full"
                label="Year Built"
                placeholder="Enter course year built"
                type="number"
              />
            </div>
            <div className="flex items-end gap-2">
              <Input
                name="architect"
                register={() => undefined}
                className="w-full"
                label="Architect"
                placeholder="Enter course architect"
              />
              <Input
                name="greens"
                register={() => undefined}
                className="w-full"
                label="Greens"
                placeholder="Enter course greens"
              />
            </div>
            <div className="flex items-end gap-2">
              <Input
                name="fairway"
                register={() => undefined}
                className="w-full"
                label="Fairway"
                placeholder="Enter course fairway"
              />
              <Select
                values={["Spring", "Summer", "Fall", "Winter"]}
                value={""}
                setValue={() => undefined}
                label="Seasons"
                placeholder="Select course seasons"
              />
            </div>
            <div className="flex items-end gap-2">
              <Select
                values={["Fixed"]}
                value={""}
                setValue={() => undefined}
                label="Markup Type"
                placeholder="Select markup type"
              />
              <Input
                name="markupValue"
                register={() => undefined}
                className="w-full"
                label="Markup Value"
                placeholder="Select markup type first"
              />
            </div>
            <div className="flex items-end gap-2">
              <Input
                name="convenienceFee"
                register={() => undefined}
                className="w-full"
                label="Convenience Fee"
                placeholder="0.00"
                icon={<DollarSign />}
              />
              <div />
            </div>
          </section>

          <section className="w-full flex flex-col gap-1 pt-2 text-primary-gray mt-4">
            <p className="text-black text-[18px]">
              Charities, Sensible Weather, Auctions
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <div className="w-full flex items-center gap-2 text-[14px]">
                  <Switch
                    value={allowsCharities}
                    setValue={setAllowsCharities}
                    data-testid={`allow-charity-id`}
                  />
                  <div className="text-primary-gray">Allows Charities</div>
                </div>
                {allowsCharities ? (
                  <div className="w-full flex flex-col gap-1 pt-2 text-primary-gray fade-in">
                    <p>Select allowed charities below</p>
                    <div className="w-full rounded-sm flex flex-col gap-1 border border-[#B0B7BC] p-3 max-h-[150px] overflow-auto">
                      {charities.map((course, idx) => (
                        <Checkbox label={course} key={idx} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="w-full flex items-center gap-2 text-[14px]">
                <Switch value={true} setValue={() => undefined} />
                <div className="text-primary-gray">
                  Activate Sensible Weather
                </div>
              </div>
              <div className="w-full flex items-center gap-2 text-[14px]">
                <Switch value={true} setValue={() => undefined} />
                <div className="text-primary-gray">Allows Auctions</div>
              </div>
            </div>
          </section>

          <section className="w-full flex flex-col gap-1 pt-2 text-primary-gray mt-4">
            <p className="text-black text-[18px]">
              Tee Sheet, Payment Processor, Policies
            </p>
            <Select
              values={["Tee Sheet 23"]}
              value={""}
              setValue={() => undefined}
              label="Tee Sheet"
              placeholder="Select tee sheet"
            />
            <div className="flex items-end gap-2">
              <Select
                values={["Square"]}
                value={""}
                setValue={() => undefined}
                label="Payment Processor"
                placeholder="Select payment processor"
              />
              <Input
                name="paymentProcessorKey"
                register={() => undefined}
                className="w-full"
                label="Key (Optional)"
                placeholder="Enter key"
              />
            </div>
            <Textarea
              name="coursePolicy"
              register={() => undefined}
              className="w-full"
              label="Course Policy"
              defaultValue={""}
              placeholder="Start typing here..."
              rows={4}
            />
            <Textarea
              name="courseTermsAndConditions"
              register={() => undefined}
              className="w-full"
              label="Terms & Conditions"
              defaultValue={""}
              placeholder="Start typing here..."
              rows={4}
            />
            <div className="flex items-end gap-2">
              <Select
                values={["10:00AM", "11:00AM", "12:00PM"]}
                value={""}
                setValue={() => undefined}
                // @dev using setCourse here during layout, will switch to setValue from useForm hook and not use useState
                label="Open Time"
                isReadOnly={isEdit}
                placeholder="Select a time"
                icon={<Clock />}
              />
              <Select
                values={["10:00AM", "11:00AM", "12:00PM"]}
                value={""}
                setValue={() => undefined}
                // @dev using setCourse here during layout, will switch to setValue from useForm hook and not use useState
                label="Close Time"
                isReadOnly={isEdit}
                placeholder="Select a time"
                icon={<Clock />}
              />
            </div>
            {isEdit ? null : (
              <Input
                name="daysInAdvance"
                register={() => undefined}
                className="w-full"
                label="Days In Advance To Display Tee Times"
                placeholder="Enter days"
                defaultValue={"0"}
              />
            )}
          </section>

          <section className="w-full flex flex-col gap-1 pt-2 text-primary-gray mt-4">
            <p className="text-black text-[18px]">Logo & Images</p>
            <DropMedia
              label="Logo"
              id="logo"
              name="logo"
              register={() => undefined}
              allowMultiple={false}
              src={[]}
              dataTestId="logo-id"
            />
            <DropMedia
              label="Carousel Images"
              id="carouselImages"
              name="carouselImages"
              register={() => undefined}
              allowMultiple={true}
              src={[]}
              dataTestId="carousel-image-id"
            />
          </section>

          <div className="flex items-center justify-end gap-2 w-full mt-4">
            <OutlineButton className="min-w-[90px]">Preview</OutlineButton>
            <OutlineButton className="min-w-[90px]" onClick={onClose}>
              Cancel
            </OutlineButton>
            <FilledButton className="min-w-[90px]">Save</FilledButton>
          </div>
        </section>
      </form>
    </Wrapper>
  );
};
