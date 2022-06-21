<!--

Copyright 2022 Elyra Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
# Tutorial

This tutorial explains the basic concepts in the NLP editor.
The flow created in this tutorial can be imported from [sample-flows/tutorial-flow.json](./sample-flows/tutorial-flow.json) 
and can be executed by uploading the text file [4Q2006.txt](./sample-data/revenue by division/financial statements/4Q2006.txt) into the **Input Document** .

## Set up the input document

Under **Extractors**, drag and drop **Input Documents** on the canvas. Configure with document [4Q2006.txt](./sample-data/revenue by division/financial statements/4Q2006.txt). Click **Upload**, then **Close**.

![img.png](images/tutorial_input.png)

## Create a dictionary of division names 

Under **Extractors**, drag **Dictionary** on the canvas. Connect its input to the output of **Input Documents**. 
Rename the node to `Division` and enter the terms: `Software`, `Global Business Services`, and `Global Technology Services`. Click **Save**.

![img.png](images/tutorial_division.png)

## Run the dictionary and see results highlighted

Select the `Division` node, and click **Run**. 

![img.png](images/tutorial_division_run.png)

## Create a second dictionary of metric names

Similar to the prior step, create a dictionary called `Metric` with a single term `revenue`. Select **Ignore case** and **Lemma Match**. Don't forget to click **Save**.

![img_1.png](images/tutorial_metric.png)

## Create a second dictionary of prepositions

Create a dictionary `Preposition` with terms `for`, and `from`. Select **Ignore case**. Click **Save**.

![img_1.png](images/tutorial_preposition.png)

## Create a sequence for "division revenue"

Create a sequence that identifies text such as _"Software revenues"_. Under **Generation**, drag and drop **Sequence** to the canvas. Connect its input with the outputs of nodes `Division` and `Metric`. 
Open the sequence, rename it to `RevenueOfDivision1` and write `(<Division.Division>)<Token>{0,2}(<Metric.Metric>)` under **Sequence Pattern**. Click **Save**. Run the sequence to see results.

![img.png](images/tutorial_revofdiv1.png)

![img.png](images/tutorial_revofdiv1_run.png)

## Create a sequence for "revenue from a division"

1. Create another sequence called `RevenueOfDivision2` to identify text such as _"revenues from Software"_. Connect its input to the output of nodes `Metric`, `Preposition`, and `Division`. Modify the Sequence Pattern as: `(<Metric.Metric>)<Token>{0,1}(<Preposition.Preposition>)<Token>{0,2}(<Division.Division>)`. 
**Note:** the order in which you connect the inputs of the sequence dictates the initial sequence pattern filled in by default. 

Click **Save** and **Run**.

![img.png](images/tutorial_revofdiv2.png)

![img.png](images/tutorial_revofdiv2_run.png)

## Create a union

Under **Generation**, drag **Union** to the canvas. Connect its inputs to the outputs of `RevenueOfDivision1` and `RevenueOfDivision2`. Rename the union to `RevenueOfDivision`. Click **Close** and **Run**.

![img.png](images/tutorial_revofdiv.png)









