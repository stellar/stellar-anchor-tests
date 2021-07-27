import React from "react";
import { useState } from "react";
import { Modal, Heading4, Select, Input, Button } from "@stellar/design-system";
import { CustomerImageConfig } from "types/config";

interface ImageModalProps {
  imageConfig: Record<string, CustomerImageConfig>;
  setImageConfig: (ic: Record<string, CustomerImageConfig>) => void;
  sep12Config: any;
}

interface ImageFormData {
  customerKey: string;
  imageType: string;
  fileName: string;
  image: Buffer;
}

interface ImageFormProps {
  customerNames: string[];
  formData?: ImageFormData;
}

const ImageUploadForm: React.FC<ImageFormProps> = (props) => {
  const [imageFormData, setImageFormData] = useState(
    props.formData || ({} as ImageFormData),
  );

  const handleFileChange = async (files: FileList | null) => {
    if (!files?.length) return;
    const buf = Buffer.from(await files[0].arrayBuffer());
    setImageFormData({ ...imageFormData, image: buf, fileName: files[0].name });
  };

  return (
    <>
      <Select
        id="customerKey"
        label="Customer Key"
        onChange={(e) =>
          setImageFormData({ ...imageFormData, customerKey: e.target.value })
        }
      >
        {props.customerNames.map((ck) => (
          <option key={ck} value={ck}>
            {ck}
          </option>
        ))}
      </Select>
      <Select
        id="imageType"
        label="Image Type"
        onChange={(e) =>
          setImageFormData({ ...imageFormData, imageType: e.target.value })
        }
      >
        <option key="photo_id_front" value="PhotoIdFront">
          Photo ID (front)
        </option>
        <option key="photo_id_back" value="PhotoIdBack">
          Photo ID (back)
        </option>
        <option
          key="notary_approval_of_photo_id"
          value="NotaryApprovalOfPhotoId"
        >
          Notary Approval of Photo ID
        </option>
        <option key="photo_proof_residence" value="PhotoProofResidence">
          Photo Proof of Residence
        </option>
      </Select>
      {!imageFormData.fileName && (
        <Input
          id="imageFile"
          type="file"
          label="Upload Image"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      )}
      {imageFormData.fileName && <p>{imageFormData.fileName}</p>}
    </>
  );
};

export const ImageUploadModalContent: React.FC<ImageModalProps> = ({
  imageConfig,
  sep12Config,
}) => {
  const addImageUploadForm = () => {};

  return (
    <>
      <Modal.Heading>Upload Customer Images</Modal.Heading>
      <Modal.Body>
        <p>
          Anchors often require images of customer documents as a part of the
          KYC process. For example, an anchor may require a user's photo ID
          before allowing a withdrawal of funds over a certain limit. If your
          anchor does not require any images of customer records, you can close
          this window and continue testing.
        </p>
        <p>
          To associate an image with a customer, select the customer from the
          dropdown menu below, specify the type of document you would like to
          upload, and upload the file.
        </p>
        <Heading4>Customer Images</Heading4>
        {Object.entries(imageConfig).map(
          ([customerKey, customerImageConfig]) => {
            return (
              <>
                {Object.entries(customerImageConfig).map(
                  ([imageType, imageNameAndBuffer]) => {
                    return (
                      <ImageUploadForm
                        customerNames={Object.keys(sep12Config.customers)}
                        formData={{
                          customerKey: customerKey,
                          imageType: imageType,
                          fileName: imageNameAndBuffer[0],
                          image: imageNameAndBuffer[1],
                        }}
                      />
                    );
                  },
                )}
              </>
            );
          },
        )}
        <ImageUploadForm customerNames={Object.keys(sep12Config.customers)} />
        <Button id="addImageUploadFormButton" onClick={addImageUploadForm}>
          Add Image
        </Button>
      </Modal.Body>
    </>
  );
};
