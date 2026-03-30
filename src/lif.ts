import { z } from "zod";

/**
 * 8.3.7 ActionParameter
 */
export const ActionParameterSchema = z.object({
  /** @type {string} Key which must be unique among the collection of action parameters. */
  key: z.string(),
  /** @type {string} Value corresponding to the key. */
  value: z.string(),
});
export type ActionParameter = z.infer<typeof ActionParameterSchema>;

/**
 * 8.3.6 Action
 */
export const ActionSchema = z.object({
  /** @type {string} Name of the action same as described in the VDA 5050 specification document. (Manufacturer-specific actions can be specified) */
  actionType: z.string(),
  /** @type {string} (optional) Brief description of the action. */
  actionDescription: z.string().optional(),
  /** @type {string} (optional) Enum {REQUIRED, CONDITIONAL, OPTIONAL} */
  requirementType: z.enum(["REQUIRED", "CONDITIONAL", "OPTIONAL"]).optional(),
  /** @type {string} Enum {NONE, SOFT, HARD} */
  blockingType: z.enum(["NONE", "SOFT", "HARD"]),
  /** @type {array of JSON-object} (optional) Exact list of parameters and their statically defined values which must be sent along with this action. */
  actionParameters: z.array(ActionParameterSchema).optional(),
});
export type Action = z.infer<typeof ActionSchema>;

/**
 * 8.3.4 NodePosition (Geometric location of the node)
 */
export const NodePositionSchema = z.object({
  /** @type {float64} Unit: metre. X position on the layout in reference to the global origin. */
  x: z.number(),
  /** @type {float64} Unit: metre. Y position on the layout in reference to the global origin. */
  y: z.number(),
});
export type NodePosition = z.infer<typeof NodePositionSchema>;

/**
 * 8.3.5 VehicleTypeNodeProperty
 */
export const VehicleTypeNodePropertySchema = z.object({
  /** @type {string} Unique Id for type of vehicle to which these properties apply on this node. */
  vehicleTypeId: z.string(),
  /** @type {float64} Unit: rad. (optional) Range: [-Pi ... Pi]. Absolute orientation of the vehicle on the node in reference to the global origin's rotation. */
  theta: z.number().min(-Math.PI).max(Math.PI).optional(),
  /** @type {array of JSON-object} (optional) Holds actions that can be integrated into the order by the (third-party) master control system. */
  actions: z.array(ActionSchema).optional(),
});
export type VehicleTypeNodeProperty = z.infer<
  typeof VehicleTypeNodePropertySchema
>;

/**
 * 8.3.4 Node
 */
export const NodeSchema = z.object({
  /** @type {string} Unique identifier of the node across all layouts contained in this LIF file. */
  nodeId: z.string(),
  /** @type {string} (optional) Name of the node. This should only be for visualization purposes. */
  nodeName: z.string().optional(),
  /** @type {string} (optional) Brief description of the node. This should only ever be for visualization or diagnostic purposes. */
  nodeDescription: z.string().optional(),
  /** @type {string} (optional) Unique identification of the map in which the node or node's position is referenced. */
  mapId: z.string().optional(),
  /** @type {JSON-object} Geometric location of the node. */
  nodePosition: NodePositionSchema,
  /** @type {array of JSON-object} Vehicle type specific properties for this node. This attribute must not be empty. */
  vehicleTypeNodeProperties: z.array(VehicleTypeNodePropertySchema).min(1),
});
export type Node = z.infer<typeof NodeSchema>;

/**
 * 8.3.10 LoadRestriction
 */
export const LoadRestrictionSchema = z.object({
  /** @type {boolean} "true": This edge may be used by an unloaded vehicle. "false": This edge must not be used by an unloaded vehicle. */
  unloaded: z.boolean(),
  /** @type {boolean} "true": This edge may be used by a loaded vehicle. "false": This edge must not be used by a loaded vehicle. */
  loaded: z.boolean(),
  /** @type {array of string} (optional) List of load sets that may be transported by the vehicle on this edge. */
  loadSetNames: z.array(z.string()).optional(),
});
export type LoadRestriction = z.infer<typeof LoadRestrictionSchema>;

/**
 * 8.3.12 ControlPoint
 */
export const ControlPointSchema = z.object({
  /** @type {float64} Unit: metre. X position on the layout in reference to the global origin. */
  x: z.number(),
  /** @type {float64} Unit: metre. Y position on the layout in reference to the global origin. */
  y: z.number(),
  /** @type {float64} (optional) Range:[0.0 ... float64.max]. The weight with which this control point pulls on the curve. When not defined, the default is 1.0. */
  weight: z.number().min(0).optional(),
});
export type ControlPoint = z.infer<typeof ControlPointSchema>;

/**
 * 8.3.11 Trajectory
 */
export const TrajectorySchema = z
  .object({
    /** @type {integer} (optional) Range: [1.0 ... integer.max]. Defines the number of control points that influence any given point on the curve. If not defined, the default value is 1. */
    degree: z.number().int().min(1).optional().default(1),
    /** @type {array of float64} Range: [0.0 ... 1.0]. Sequence of parameter values that determines where and how the control points affect the NURBS curve. knotVector has size of number of control points + degree + 1. */
    knotVector: z.array(z.number().min(0).max(1)),
    /** @type {array of JSON-object} List of JSON controlPoint JSON-objects defining the control points of the NURBS, which includes the beginning and end points. */
    controlPoints: z.array(ControlPointSchema),
  })
  .superRefine((data, ctx) => {
    const degree = data.degree ?? 1;
    const expectedLength = data.controlPoints.length + degree + 1;

    if (data.knotVector.length !== expectedLength) {
      ctx.addIssue({
        code: "custom",
        message: `knotVector length must be controlPoints(${data.controlPoints.length}) + degree(${degree}) + 1 = ${expectedLength}`,
        path: ["knotVector"],
      });
    }
  });
export type Trajectory = z.infer<typeof TrajectorySchema>;

/**
 * 8.3.9 VehicleTypeEdgeProperty
 */
export const VehicleTypeEdgePropertySchema = z.object({
  /** @type {string} Unique Id for the type of vehicle to which these properties apply on this edge. */
  vehicleTypeId: z.string(),
  /** @type {float64} Unit: rad. (optional) Orientation of the vehicle on the edge. */
  vehicleOrientation: z.number().optional(),
  /** @type {string} (optional) Enum {GLOBAL, TANGENTIAL}. If not defined, the default value is "TANGENTIAL". */
  orientationType: z.enum(["GLOBAL", "TANGENTIAL"]).optional(),
  /** @type {boolean} "true": rotation is allowed on the edge. "false": rotation is not allowed on the edge. */
  rotationAllowed: z.boolean(),
  /** @type {string} (optional) Enum {NONE, CCW, CW, BOTH}. Allowed directions of rotation for the vehicle at the start node. */
  rotationAtStartNodeAllowed: z.enum(["NONE", "CCW", "CW", "BOTH"]).optional(),
  /** @type {string} (optional) Enum {NONE, CCW, CW, BOTH}. Allowed directions of rotation for the vehicle at the end node. */
  rotationAtEndNodeAllowed: z.enum(["NONE", "CCW", "CW", "BOTH"]).optional(),
  /** @type {float64} Unit: m/s. (optional) Permitted maximum speed on the edge. */
  maxSpeed: z.number().optional(),
  /** @type {float64} Unit: rad/s. (optional) Maximum rotation speed. */
  maxRotationSpeed: z.number().optional(),
  /** @type {float64} Unit: metre. (optional) Permitted minimal height of the load handling device on the edge. */
  minHeight: z.number().optional(),
  /** @type {float64} Unit: metre. (optional) Permitted maximum height of the vehicle, including the load, on edge. */
  maxHeight: z.number().optional(),
  /** @type {JSON-object} (optional) Describes the load restriction on this edge for a vehicle of the corresponding vehicleTypeId. */
  loadRestriction: LoadRestrictionSchema.optional(),
  /** @type {array of JSON-object} (optional) Holds actions that can be integrated into the order by the (third-party) master control system each time any vehicle with the corresponding vehicleTypeId is sent an order/order update that contains this edge. */
  actions: z.array(ActionSchema).optional(),
  /** @type {JSON-object} (optional) Trajectory JSON-object for this edge as a NURBS. */
  trajectory: TrajectorySchema.optional(),
  /** @type {boolean} (optional) "true": Vehicles are allowed to enter into automatic management by the master control system while on this edge. "false": not allowed. */
  reentryAllowed: z.boolean().optional(),
});
export type VehicleTypeEdgeProperty = z.infer<
  typeof VehicleTypeEdgePropertySchema
>;

/**
 * 8.3.8 Edge
 */
export const EdgeSchema = z.object({
  /** @type {string} Unique identifier of the edge across all layouts within this LIF file. */
  edgeId: z.string(),
  /** @type {string} (optional) Name of the edge. This should only be for visualization purposes. */
  edgeName: z.string().optional(),
  /** @type {string} (optional) Brief description of the edge. This should only be used for visualization or diagnostic purposes. */
  edgeDescription: z.string().optional(),
  /** @type {string} Id of the start node. The start node must always be part of the current layout. */
  startNodeId: z.string(),
  /** @type {string} Id of the end node. The end node can be located in another layout. */
  endNodeId: z.string(),
  /** @type {array of JSON-object} Vehicle type specific properties for this edge. This attribute must not be empty. */
  vehicleTypeEdgeProperties: z.array(VehicleTypeEdgePropertySchema).min(1),
});
export type Edge = z.infer<typeof EdgeSchema>;

/**
 * 8.3.13 StationPosition (Centre point and orientation of the station)
 */
export const StationPositionSchema = z.object({
  /** @type {float64} Unit: metre. X position of the station in the layout in reference to the global origin. */
  x: z.number(),
  /** @type {float64} Unit: metre. Y position of the station in the layout in reference to the global origin. */
  y: z.number(),
  /** @type {float64} Unit: radians. (optional) Range: [-Pi ... Pi]. Absolute orientation of the station on the node. */
  theta: z.number().min(-Math.PI).max(Math.PI).optional(),
});
export type StationPosition = z.infer<typeof StationPositionSchema>;

/**
 * 8.3.13 Station
 */
export const StationSchema = z.object({
  /** @type {string} Unique identifier of the station across all layouts within this LIF file. */
  stationId: z.string(),
  /** @type {array of string} List of nodeIds for this station. This attribute must not be empty; there must be at least one nodeId. */
  interactionNodeIds: z.array(z.string()).min(1),
  /** @type {string} (optional) Human-readable name for the station (e.g., for displaying). */
  stationName: z.string().optional(),
  /** @type {string} (optional) Brief description of the station. */
  stationDescription: z.string().optional(),
  /** @type {float64} Unit: metre. (optional) Range: [0 ... float64.max]. Absolute physical height of the station. */
  stationHeight: z.number().min(0).optional(),
  /** @type {JSON-object} (optional) Centre point and orientation of the station. Only for visualization purposes. */
  stationPosition: StationPositionSchema.optional(),
});
export type Station = z.infer<typeof StationSchema>;

/**
 * 8.3.2 MetaInformation
 */
export const MetaInformationSchema = z.object({
  /** @type {string} Human-readable name of the project (e.g., for display purposes). */
  projectIdentification: z.string(),
  /** @type {string} Creator of the LIF file (e.g., name of company, or name of person). */
  creator: z.string(),
  /** @type {string} The timestamp at which this LIF file was created/updated/modified. Timestamp format is ISO8601 in UTC. */
  exportTimestamp: z.string(), // Can use z.string().datetime() for stricter validation
  /** @type {string} Version of LIF:[Major].[Minor].[Patch] (e.g., "1.0.0"). */
  lifVersion: z.string(),
});
export type MetaInformation = z.infer<typeof MetaInformationSchema>;

/**
 * 8.3.3 Layout
 */
export const LayoutSchema = z.object({
  /** @type {string} Unique identifier for this layout. */
  layoutId: z.string(),
  /** @type {string} (optional) Human-readable name of the layout (e.g., for displaying). */
  layoutName: z.string().optional(),
  /** @type {string} Version of the layout. */
  layoutVersion: z.string(),
  /** @type {string} (optional) This attribute can be used to explicitly indicate which level or floor within a building or buildings a layout represents. */
  layoutLevelId: z.string().optional(),
  /** @type {string} (optional) Brief description of the layout. */
  layoutDescription: z.string().optional(),
  /** @type {array of JSON-object} Collection of all nodes in the layout. */
  nodes: z.array(NodeSchema),
  /** @type {array of JSON-object} Collection of all edges in the layout. */
  edges: z.array(EdgeSchema),
  /** @type {array of JSON-object} Collection of all stations in the layout. */
  stations: z.array(StationSchema),
});
export type Layout = z.infer<typeof LayoutSchema>;

/**
 * LIF - Layout Interchange Format (Version 1.0.0) Root Schema
 * Definition of a format of track layouts for exchange according to VDMA guidelines.
 */
export const LIFRootSchema = z.object({
  /** @type {JSON-object} Contains meta information. */
  metaInformation: MetaInformationSchema,
  /** @type {array of JSON-object} Collection of layouts used in the facility by the driverless transport system. */
  layouts: z.array(LayoutSchema),
});
export type LIFRoot = z.infer<typeof LIFRootSchema>;