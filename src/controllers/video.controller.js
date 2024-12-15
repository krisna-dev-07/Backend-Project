import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

// get all videos based on query, sort, pagination

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    console.log(userId);
    console.log(req.query);

    const pipeline = [];     // Initialize an empty array to store the pipeline stages

    /* 
    for using Full Text based search u need to create a search index in mongoDB atlas
    -: you can include field mapppings in search index eg.title, description, as well
    -: Field mappings specify which fields within your documents should be indexed for text search.
    -: this helps in seraching only in title, desc providing faster search results
    -:here the name of search index is 'search-videos'

    -:  to create search in mongodb atlas follow this steps:
    -:     1.Go to MongoDB Atlas:Select your cluster.
    -:     2.Navigate to Collections:Open the collection (e.g., videos) where 
    -:        you want to enable full-text search.
    -:     3.Create a Search Index:Click on the Search Index tab.
    -:     4.Create a new index with a name (e.g., search-videos).
    -:     5.Specify the fields to index (e.g., title, description).
    -:     6.Save the Index:Once the index is created, MongoDB will use it for $search queries.*/
    if (query) {
        // Add a $search stage to the pipeline
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"] //search only on title, desc
                }
            }
        });
    }

    if (userId) {
        // Check if the userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        // Add a $match stage to the pipeline

        pipeline.push({
            $match: {
                //This converts the userId string into a MongoDB ObjectId (using new mongoose.Types.ObjectId(userId)).
                owner: mongoose.Types.ObjectId(userId) // Use the updated method
            }
        });
    }

    // fetch videos only that are set isPublished as true
    pipeline.push({
        // Add a $match stage to the pipeline
        $match: { isPublished: true }
    });

    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    if (sortBy && sortType) {
        pipeline.push({
            // Add a $sort stage to the pipeline
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    }
    else {
        pipeline.push({
            $sort: {
                createdAt: -1
            }
        });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    )

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };
    // parseInt(page, 10) and parseInt(limit, 10): These convert the page and limit values from strings (from query parameters) into integers. The second argument (10) specifies the base (decimal) for the conversion.

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));

})