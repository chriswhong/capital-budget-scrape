# NYC Capital Budget Scraper

A set of node scripts for scraping the NYC Capital budget PDFs

## Overview

The City of New York appropriates billions of dollars each year for Capital Projects.  These include sewers, roads, infrastructure, investments in cultural institutions, building construction, technology projects, and more.

The published capital budget document is a PDF, and is available for download on the Office of Management and Budget's [Budget Publications](https://www1.nyc.gov/site/omb/publications/publications.page) website.

For example, here is [the fiscal year 2020 Capital Budget PDF](https://www1.nyc.gov/assets/omb/downloads/pdf/cb7-19.pdf), published in July of 2019.  It is 589 pages long, and most of it consists of computer-generated printouts detailing appropriations and balances over the next four years.

The Capital Budget deals with **budget lines**, cost areas that money can be appropriated for.  Beneath *budget lines* are **capital projects**, but you won't find any mention of them in the budget.  (Details about capital projects appear in the capital commitment plan).  Usually budget lines are "buckets" of money allocated for a type of project, and capital projects are more specific and discrete, but it's not always this cut and dry.

Needless to say, while the information has been made public, it's not provided in a very useful context.  It's clear that you must look across many years of these PDFs to understand spending in a budget line. To get a complete picture of capital money, it's necessary to combine the data in the budget with data from the capital commitment plan, and then compare that to capital spending data from Checkbook NYC.

This repository is an effort to reliably scrape the data from any Capital Budget PDF, as their machine-generated PDF format is virtually identical from year to year.

## Goal of the Project

The preliminary goal of the project is to cobble together the most complete collection of data about the capital budget from public sources.  

The follow-on goal is to make the information easy to access by building a searchable web interface.  (Some work has already been done on this front, and can be seen at [capital-commitments.chriswhong.com](https://capital-commitments.chriswhong.com))

## Three Important Sections

The three sections we are interested in are:

1. The Capital Budget (scraped by `capital-budget.js`) - This is the "meat" of the budget, containing the new appropriations for a budget line, or reporting on available appropriation of "continuing projects".   It also contains "$ required to complete" and "estimated date of completion" for new budget lines, but these do not appear to be consistently populated.  One "row" of the budget spans two pages in the PDF.

2. Rescindments (scraped by `rescindments.js`) - Rescindments are funds appropriated in prior budgets that are being pulled back out.  If budget lines are accounts that are filled with appropriations and then drawn down through contracts and spending, these rescindments are pulling money out the account for use somewhere else.  (I assume either because things come in under budget or our priorities change)

3. Geography Analysis (scraped by `geography-analysis.js`) - While the holy grail is a map of the Capital Budget, the official publication only categorizes a budget line as "Citywide", or as being specific to one of the five boroughs.  

I've discovered that a document called "[Geographic Report for the Capital Budget](http://www.cb11m.org/wp-content/uploads/2019/02/FY20-Geographic-Report-For-the-Capital-Budget-Departmental-Estimates.pdf)" exists which goes deeper and matches budget lines with specific community districts.  As far as I can tell these are not published by OMB, but have been published by third parties.

## Running the Scrapers

You'll need [node](https://nodejs.org/en/) installed to run these scripts.

Adopted Capital Budget PDFs are located in `/pdf` with the naming convention `cbfyXX.pdf`.  I'm choosing 2008 as a starting point for my scraping, as it gets us a solid decade of data.  Older pdfs are available if we choose to expand the project.

### pdf to text

The first step is to convert the PDFs into txt files using the command line tool `pdftotext`.  It can be [installed on a Mac using brew](http://macappstore.org/pdftotext/)

The command I've had success with is as follows, and uses the x, y, W, H, fixed, and layout flags to specify the precise section of the page to convert, with a precise column width.  This leads to spot-on column alignment, which is necessary for consistently pulling out values.

```
pdftotext -x 35 -y 20 -W 538 -H 1000 -fixed 4.08 -layout {inputPath} {outputPath}
```

Use `sh pdf-to-text.sh` to run this command on every file in `/pdf`, which will create a corresponding txt file with the same name in `/txt`

### txt to json

The scrapers all work in roughly same pattern:

- iterate over each line of the source txt file
- use pattern matching to detect the line where the section of interest starts
- use pattern matching to determine the internal iteration for a section of interest (where does one budget line start and end?)
- pull out substrings from a line, storing them as keys in an object.  Push that object to an array once it is "complete"
- use pattern matching to detect the line where the section of interest ends
- write the array of objects to a json file

`capital-budget.js` scrapes the capital budget, and creates `{filename}.json` as an array of objects in `/json`

`rescindments.js` scrapes the rescindments section, and creates `{filename}-rescindments.json` as an array of objects in `/json`

`geographic-analysis.js` scrapes the geographic analysis section and creates ``

Use `sh txt-to-json.sh` to run all three scrapers on each file in `/txt`, creating , `{filename}-rescindments.json`, and `{filename}-geographic.json` in `/json`

# Links

- Prior work scraping the capital commitment plan (Github) to be cleaned up and incorporated into this repo.
- An express website for exploring the capital budget (Live Site) (Github)

# TODO

- Obtain Geographic Report for the Capital Budget PDFs from FY2008 to present and write scrapers
