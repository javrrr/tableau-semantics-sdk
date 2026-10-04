// Auto-generated — DO NOT EDIT
export type paths = {
    "/ssot/semantic/models/{modelApiNameOrId}/shallow": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                modelApiNameOrId: string;
            };
            cookie?: never;
        };
        /** @description This endpoint retrieves a shallow version of a semantic model, meaning it excludes any definitions that are inherited from extended models. Extended models are models that are built upon a base model by adding additional layers of data or logic. This is useful when you need a lightweight version of the model with only the essential base structure and no additional inherited definitions. */
        get: operations["getSemanticModelShallow"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ssot/semantic/models/{modelApiNameOrId}/clone": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                modelApiNameOrId: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Create a new semantic model by cloning an existing one. creates an exact duplicate of the model. After cloning, you can modify the new model independently of the original one. This is helpful for creating variations or experimenting with a model without affecting the original. */
        post: operations["postSemanticModelClone"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ssot/semantic/models/{modelApiNameOrId}/validate": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                modelApiNameOrId: string;
            };
            cookie?: never;
        };
        /** @description This endpoint validates a semantic model to ensure its structure and configuration are correct. It checks for errors or inconsistencies in the model's design and provides a detailed report on the validation results. This is essential for ensuring the model is properly configured before it is used in production. */
        get: operations["getSemanticModelValidation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ssot/semantic/models/{modelApiNameOrId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                modelApiNameOrId: string;
            };
            cookie?: never;
        };
        /** @description Retrieve a complete semantic model. */
        get: operations["getSemanticModel"];
        /** @description This endpoint replaces the entire configuration of a semantic model with the new definition provided in the request body. Unlike PATCH, which only updates specific fields, PUT replaces the entire model, including all fields, relationships, and dependencies. This is useful when you want to fully redefine a model’s structure. */
        put: operations["putSemanticModel"];
        post?: never;
        /** @description This endpoint deletes a semantic model. Once deleted, the model is permanently removed from the system and can no longer be accessed or used. Be sure to review the model before deletion, as this action is irreversible. */
        delete: operations["deleteSemanticModel"];
        options?: never;
        head?: never;
        /** @description This endpoint updates specific fields of a semantic model. Unlike the PUT method, this operation modifies only the fields you specify, leaving the rest of the model and its relationships intact. This is useful when you need to make small adjustments without changing the entire model structure. */
        patch: operations["patchSemanticModel"];
        trace?: never;
    };
    "/semantic-engine/gateway": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Executes a semantic query */
        post: operations["postSemanticQueryExecute"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
};
export type webhooks = Record<string, never>;
export type components = {
    schemas: {
        /** @enum {string} */
        SemanticModelSourceCreationTypeEnum: "Manual" | "Import";
        /** @description Semantic model external connection output representation */
        SemanticModelExternalConnectionOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic parameter output representation */
        SemanticParameterOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic relationship output representation */
        SemanticRelationshipOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @enum {string} */
        SemanticCategoryEnum: "Marketing" | "Commerce" | "Sales" | "Service" | "Other";
        /** @description Semantic model currency output representation */
        SemanticModelCurrencyOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic grouping output representation */
        SemanticGroupingOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @enum {string} */
        SemanticQueryUnrelatedDataObjectsTypeEnum: "Allow" | "Disallow";
        /** @description Semantic override output representation */
        SemanticOverrideOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic calculated dimension output representation */
        SemanticCalculatedDimensionOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic metric output representation */
        SemanticMetricOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic data object output representation */
        SemanticDataObjectOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @enum {string} */
        SemanticEntityQueryableEnum: "Queryable" | "NonQueryable";
        /** @description The output representation of a specific semantic model. */
        SemanticModelOutputRepresentation: {
            [key: string]: unknown;
        } & (components["schemas"]["SemanticAbstractModelPartialOutputRepresentation"] & {
            /** @description The semantic overrides belonging to this model. */
            fieldsOverrides?: components["schemas"]["SemanticOverrideOutputRepresentation"][];
            /** @description The semantic model contains unmapped semantic definition. */
            hasUnmapped?: boolean;
            /** @description Indicates if the model is partial because of Data Gov. */
            isPartialSdm?: boolean;
            /** @description The semantic calculated dimensions belonging to this model. */
            semanticCalculatedDimensions?: components["schemas"]["SemanticCalculatedDimensionOutputRepresentation"][];
            /** @description The semantic calculated measurements belonging to this model. */
            semanticCalculatedMeasurements?: components["schemas"]["SemanticCalculatedMeasurementOutputRepresentation"][];
            /** @description The list of semantic data objects belonging to the semantic model. */
            semanticDataObjects?: components["schemas"]["SemanticDataObjectOutputRepresentation"][];
            /** @description The semantic groupings belonging to this model. */
            semanticGroupings?: components["schemas"]["SemanticGroupingOutputRepresentation"][];
            /** @description The semantic logical views belonging to this model. */
            semanticLogicalViews?: components["schemas"]["SemanticLogicalViewOutputRepresentation"][];
            /** @description The semantic metrics belonging to this model. */
            semanticMetrics?: components["schemas"]["SemanticMetricOutputRepresentation"][];
            semanticModelInfo?: components["schemas"]["SemanticModelInfoOutputRepresentation"];
            /** @description The list of parameters belonging to the semantic model. */
            semanticParameters?: components["schemas"]["SemanticParameterOutputRepresentation"][];
            /** @description The list of relationships belonging to the semantic model. */
            semanticRelationships?: components["schemas"]["SemanticRelationshipOutputRepresentation"][];
        });
        /** @description Semantic base model output representation */
        SemanticBaseModelOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic calculated measurement output representation */
        SemanticCalculatedMeasurementOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @enum {string} */
        SemanticModelVersionStateEnum: "Draft" | "Published" | "PublishedWithDraft";
        /** @description Semantic model info output representation */
        SemanticModelInfoOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Base Semantic Entity output representation */
        SemanticEntityOutputRepresentation: {
            /** @description The API name of the semantic entity. */
            apiName?: string;
            /** @description The origin model of the semantic entity. */
            baseModelApiName?: string;
            /**
             * Format: url
             * @description The Canonical URL of the collection for caching purposes only.
             */
            cacheKey?: string;
            /** @description The user who created the semantic entity. */
            createdBy?: string;
            /** @description The date in which the semantic entity was created. */
            createdDate?: string;
            /** @description The Description of the semantic entity. */
            description?: string;
            /** @description The externalConnectionApiName property references the external connection details for external definition */
            externalConnectionApiName?: string;
            /**
             * Format: Id
             * @description The object ID of the semantic entity.
             */
            id?: string;
            isQueryable?: components["schemas"]["SemanticEntityQueryableEnum"];
            /** @description The display name of the semantic entity to be used in the ui. */
            label?: string;
            /** @description The user who last modified the semantic entity. */
            lastModifiedBy?: string;
            /** @description The date in which the semantic entity was last modified. */
            lastModifiedDate?: string;
        } & {
            [key: string]: unknown;
        };
        /** @description A partial semantic abstract model. */
        SemanticAbstractModelPartialOutputRepresentation: {
            [key: string]: unknown;
        } & (components["schemas"]["SemanticEntityOutputRepresentation"] & {
            /** @description Indicates whether agent features are enabled for this model. */
            agentEnabled?: boolean;
            /** @description App to which the Semantic Model belongs. */
            app?: string;
            /** @description List of base models, the current model is extending. */
            baseModels?: components["schemas"]["SemanticBaseModelOutputRepresentation"][];
            /** @description Allow Analysts to include business-specific preferences or context. */
            businessPreferences?: string;
            /** @description Product category of the Semantic Model. Valid values are Marketing, Commerce, Sales, Service, and Other. */
            categories?: components["schemas"]["SemanticCategoryEnum"][];
            currency?: components["schemas"]["SemanticModelCurrencyOutputRepresentation"];
            /** @description Required. Dataspace in which the Semantic Model is located. */
            dataspace?: string;
            /** @description List of external connections of the model. */
            externalConnections?: components["schemas"]["SemanticModelExternalConnectionOutputRepresentation"][];
            /** @description Is the model locked for edit/ delete. */
            isLocked?: boolean;
            /** @description Indicates last modified date of the draft version. */
            lastDraftModifiedDate?: string;
            /** @description Indicates last modified date of the published version. */
            lastPublishedModifiedDate?: string;
            /** @description A mapping of actions to their corresponding lock reasons. Each key represents an action (e.g., 'edit', 'delete', 'clone'), and the value is a list of reasons indicating why the action is restricted. */
            lockedActions?: {
                [key: string]: string[];
            };
            queryUnrelatedDataObjects?: components["schemas"]["SemanticQueryUnrelatedDataObjectsTypeEnum"];
            /**
             * Format: url
             * @description The URL that references the Semantic Calculated Dimensions.
             */
            semanticCalculatedDimensionsUrl?: string;
            /**
             * Format: url
             * @description The URL that references the Semantic Calculated Measurements.
             */
            semanticCalculatedMeasurementsUrl?: string;
            /**
             * Format: url
             * @description The URL that references the Semantic Data Objects.
             */
            semanticDataObjectsUrl?: string;
            /**
             * Format: url
             * @description The URL that references the Semantic Groupings.
             */
            semanticGroupingsUrl?: string;
            /**
             * Format: url
             * @description The URL that references the Semantic Parameters.
             */
            semanticParametersUrl?: string;
            /**
             * Format: url
             * @description The URL that references the Semantic Relationships.
             */
            semanticRelationshipsUrl?: string;
            sourceCreation?: components["schemas"]["SemanticModelSourceCreationTypeEnum"];
            /** @description The source identifier name */
            sourceCreationName?: string;
            versionState?: components["schemas"]["SemanticModelVersionStateEnum"];
        });
        /** @description Semantic logical view output representation */
        SemanticLogicalViewOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @description The output representation of a semantic model validation response. */
        SemanticModelValidationOutputRepresentation: {
            /** @description The validated semantic model. */
            isValid: boolean;
            semanticModel: components["schemas"]["SemanticModelOutputRepresentation"];
            validation: components["schemas"]["SemanticResourceValidationOutputRepresentation"];
        } & {
            [key: string]: unknown;
        };
        /** @description Semantic resource validation output representation */
        SemanticResourceValidationOutputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic relationship input representation */
        SemanticRelationshipInputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic calculated measurement input representation */
        SemanticCalculatedMeasurementInputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Input representation for creating semantic model */
        SemanticModelInputRepresentation: components["schemas"]["SemanticModelPartialInputRepresentation"] & {
            /** @description Base semantic models */
            baseModels?: components["schemas"]["SemanticBaseModelInputRepresentation"][];
            /** @description External connections */
            externalConnections?: components["schemas"]["SemanticModelExternalConnectionInputRepresentation"][];
            /** @description Semantic field overrides within the model. */
            fieldsOverrides?: components["schemas"]["SemanticOverrideInputRepresentation"][];
            /** @description Semantic calculated dimensions within the model. */
            semanticCalculatedDimensions?: components["schemas"]["SemanticCalculatedDimensionInputRepresentation"][];
            /** @description Semantic calculated measurements within the model. */
            semanticCalculatedMeasurements?: components["schemas"]["SemanticCalculatedMeasurementInputRepresentation"][];
            /** @description Semantic data objects within the model. */
            semanticDataObjects?: components["schemas"]["SemanticDataObjectInputRepresentation"][];
            /** @description Semantic groupings within the model. */
            semanticGroupings?: components["schemas"]["SemanticGroupingInputRepresentation"][];
            /** @description Semantic logical views within the model. */
            semanticLogicalViews?: components["schemas"]["SemanticLogicalViewInputRepresentation"][];
            /** @description Semantic metrics within the model. */
            semanticMetrics?: components["schemas"]["SemanticMetricInputRepresentation"][];
            /** @description Semantic parameters within the model. */
            semanticParameters?: components["schemas"]["SemanticParameterInputRepresentation"][];
            /** @description Semantic relationships within the model. */
            semanticRelationships?: components["schemas"]["SemanticRelationshipInputRepresentation"][];
        };
        /** @description Semantic model partial input representation */
        SemanticModelPartialInputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic calculated dimension input representation */
        SemanticCalculatedDimensionInputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic override input representation */
        SemanticOverrideInputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic grouping input representation */
        SemanticGroupingInputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic metric input representation */
        SemanticMetricInputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic logical view input representation */
        SemanticLogicalViewInputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic data object input representation */
        SemanticDataObjectInputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic parameter input representation */
        SemanticParameterInputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic model external connection input representation */
        SemanticModelExternalConnectionInputRepresentation: {
            [key: string]: unknown;
        };
        /** @description Semantic base model input representation */
        SemanticBaseModelInputRepresentation: {
            [key: string]: unknown;
        };
        /**
         * @description Represents Response with an error
         * @example {
         *       "errorCode": "INVALID_API_INPUT",
         *       "message": "An error occurred in Semantic Layer. TraceId: bc7c380f3a62d44c06e4f9ed3bfe0516 Status: INVALID_ARGUMENT Error Message: INVALID_ARGUMENT: {\"message\":\"The field ffef does not exist in table AccountSemanticLayer__dll. Queryable fields are: AnnualRevenue__c,Annual Revenue,CreatedDate__c\",\"error_code\":\"USER_ILLEGAL_ARGUMENT_RESOLVE_ENTITY_ERROR\"}"
         *     }
         */
        SemanticQueryErrorResponse: {
            /** @description The error code */
            errorCode?: string;
            /** @description The message */
            message?: string;
        };
        /**
         * @description Input representation for creating Semantic Query
         * @example {
         *       "dataspace": "default",
         *       "source": "source",
         *       "structuredSemanticQuery": {
         *         "fields": [
         *           {
         *             "expression": {
         *               "table_field": {
         *                 "name": "Account Name",
         *                 "table_name": "AccountSemanticLayer__dll"
         *               }
         *             }
         *           },
         *           {
         *             "expression": {
         *               "table_field": {
         *                 "name": "Annual Revenue",
         *                 "table_name": "AccountSemanticLayer__dll"
         *               }
         *             }
         *           }
         *         ],
         *         "options": {
         *           "limit_options": {
         *             "limit": 10
         *           }
         *         },
         *         "semanticModel": {
         *           "apiName": "SalesSDM",
         *           "label": "SalesSDM",
         *           "semanticDataObjects": [
         *             {
         *               "apiName": "Sales_SDO",
         *               "label": "Sales_SDO",
         *               "dataObjectName": "Sales__dll",
         *               "dataObjectType": "Dmo",
         *               "semanticDimensions": [
         *                 {
         *                   "apiName": "Account Name",
         *                   "label": "Account Name",
         *                   "dataType": "Text",
         *                   "dataObjectFieldName": "AccountName__c"
         *                 },
         *                 {
         *                   "apiName": "Annual Revenue",
         *                   "label": "Annual Revenue",
         *                   "dataType": "Number",
         *                   "dataObjectFieldName": "AnnualRevenue__c"
         *                 }
         *               ]
         *             }
         *           ]
         *         }
         *       }
         *     }
         */
        SemanticQueryRequest: {
            /** @description Data space */
            dataspace?: string;
            /** @description source */
            source?: string;
            /** @description structuredSemanticQuery */
            structuredSemanticQuery?: Record<string, never>;
            /** @description semanticModel */
            semanticModel?: Record<string, never>;
        };
        /**
         * @description Represents Semantic Engine query output
         * @example {
         *       "queryResults": {
         *         "queryMetadata": {
         *           "fields": {
         *             "Account Name": {
         *               "placeInOrder": 0,
         *               "type": "VARCHAR"
         *             },
         *             "Annual Revenue": {
         *               "placeInOrder": 1,
         *               "type": "NUMERIC"
         *             }
         *           }
         *         },
         *         "queryData": {
         *           "rows": [
         *             {
         *               "values": [
         *                 "Ms. Penny Haley PhD",
         *                 89617
         *               ]
         *             },
         *             {
         *               "values": [
         *                 "Edwin Day MD",
         *                 59040
         *               ]
         *             },
         *             {
         *               "values": [
         *                 "Mr. Jim Watkins",
         *                 92956
         *               ]
         *             }
         *           ]
         *         }
         *       },
         *       "status": "SUCCESS"
         *     }
         */
        SemanticQueryResponse: {
            /** @description Query Results */
            queryResults?: {
                queryMetadata?: {
                    /** @description fields in the results table */
                    fields?: Record<string, never>;
                };
                queryData?: {
                    /** @description response data */
                    rows?: Record<string, never>;
                };
            };
            /** @description Status ENUM */
            status?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
    getSemanticModelShallow: {
        parameters: {
            query?: {
                /** @description If set to True, includes unmapped semantic definitions in the response. */
                allowUnmapped?: boolean;
                /** @description Returns only fields that contain the specified substring in their label. */
                fieldName?: string;
                /** @description If enabled, applies fine-grained security rules and returns a partial semantic model that respects access restrictions. */
                fineGrainSecurity?: boolean;
                /** @description If set, enriches the response with the model’s full content. */
                includeModelContent?: boolean;
            };
            header?: never;
            path: {
                modelApiNameOrId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A semantic model in shallow form is returned. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SemanticModelOutputRepresentation"];
                };
            };
        };
    };
    postSemanticModelClone: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                modelApiNameOrId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A new semantic model has been successfully cloned. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SemanticModelOutputRepresentation"];
                };
            };
        };
    };
    getSemanticModelValidation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                modelApiNameOrId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validation completed. The response includes validation details for the semantic model. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SemanticModelValidationOutputRepresentation"];
                };
            };
        };
    };
    getSemanticModel: {
        parameters: {
            query?: {
                /** @description Include unmapped semantic definitions in the response. */
                allowUnmapped?: boolean;
                /** @description Filter results to fields whose labels contain the specified text. */
                fieldName?: string;
                /** @description Apply fine-grained security filtering for a partial semantic model. */
                fineGrainSecurity?: boolean;
                /** @description Enrich the model with its content in the response. */
                includeModelContent?: boolean;
                /** @description Include information about key qualifiers and primary key indicators in the response. */
                includeTableKeys?: boolean;
            };
            header?: never;
            path: {
                modelApiNameOrId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The semantic model is returned. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SemanticModelOutputRepresentation"];
                };
            };
        };
    };
    putSemanticModel: {
        parameters: {
            query?: {
                /** @description Include unmapped semantic definitions in the response. */
                allowUnmapped?: boolean;
            };
            header?: never;
            path: {
                modelApiNameOrId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SemanticModelInputRepresentation"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SemanticModelOutputRepresentation"];
                };
            };
        };
    };
    deleteSemanticModel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                modelApiNameOrId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The semantic model is deleted. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    patchSemanticModel: {
        parameters: {
            query?: {
                /** @description If set to True, includes unmapped semantic definitions in the response. */
                allowUnmapped?: boolean;
            };
            header?: never;
            path: {
                modelApiNameOrId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SemanticModelInputRepresentation"];
            };
        };
        responses: {
            /** @description The semantic model is updated with the specified field changes. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SemanticModelOutputRepresentation"];
                };
            };
        };
    };
    postSemanticQueryExecute: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SemanticQueryRequest"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SemanticQueryResponse"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SemanticQueryErrorResponse"];
                };
            };
        };
    };
}
