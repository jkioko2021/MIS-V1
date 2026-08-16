<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Agent_info.aspx.vb" Inherits="Default2" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="#153E7E" Text="Please Wait...."></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table style="width: 100%" align="center">
                <tr>
                    <td align="center" bgcolor="#333333" colspan="4">
                        <asp:Label ID="Label6" runat="server" Font-Bold="True" Font-Size="Medium" 
                            ForeColor="Silver" style="font-weight: 700" 
                            Text="REGISTRATION"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td colspan="3">
                        <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="1121px">
                            <table style="width: 100%">
                                <tr>
                                    <td style="width: 580px">
                                        <asp:Label ID="Label73" runat="server" style="font-weight: 700" 
                                            Text="Search By"></asp:Label>
                                    </td>
                                    <td style="width: 154px">
                                        <telerik:RadComboBox ID="cbosearch" Runat="server" style="margin-left: 0px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Text="Name" Value="N" 
                                                    Owner="cbosearch" />
                                                <telerik:RadComboBoxItem runat="server" Text="Ref_No" Value="R" 
                                                    Owner="cbosearch" />
                                                <telerik:RadComboBoxItem runat="server" Text="Agent Code" Value="A" 
                                                    Owner="cbosearch" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cbosearch" Text="Payroll No" 
                                                    Value="P" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txtsearch" Runat="server" Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td>
                                        <telerik:RadButton ID="SEARCH" runat="server" Text="Search">
                                        </telerik:RadButton>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3">
                        <asp:Panel ID="Panel34" runat="server" Height="100%" ScrollBars="Both" 
                            Width="1120px">
                            <telerik:RadGrid ID="GDSEARCH_1" runat="server" AllowPaging="True" 
                                CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="Ref_No">
                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                        <HeaderStyle Width="20px" />
                                    </RowIndicatorColumn>
                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                        <HeaderStyle Width="20px" />
                                    </ExpandCollapseColumn>
                                    <Columns>
                                        <telerik:GridButtonColumn CommandName="Select" 
                                            FilterControlAltText="Filter ID column" HeaderText="Select" Text="Select" 
                                            UniqueName="Select">
                                            <HeaderStyle ForeColor="Blue" Width="50px" />
                                            <ItemStyle Width="50px" />
                                        </telerik:GridButtonColumn>
                                        
                                        <telerik:GridBoundColumn DataField="Ref_No" 
                                            FilterControlAltText="Filter Ref_No column" HeaderText="Ref_No" 
                                            SortExpression="Ref_No" UniqueName="Ref_No">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="AGENT_NAME" 
                                            FilterControlAltText="Filter AGENT_NAME column" HeaderText="Name" 
                                            SortExpression="AGENT_NAME" UniqueName="AGENT_NAME">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="Agent_Type" 
                                            FilterControlAltText="Filter Agent_Type column" HeaderText="Agent_Type" 
                                            ItemStyle-Wrap="False" SortExpression="Agent_Type" UniqueName="Agent_Type">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="Unit_Name" 
                                            FilterControlAltText="Filter Unit_Name column" HeaderText="Unit_Name" 
                                            SortExpression="Unit_Name" UniqueName="Unit_Name">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="REGION_NAME" 
                                            FilterControlAltText="Filter REGION_NAME column" HeaderText="Region" 
                                            SortExpression="REGION_NAME" UniqueName="REGION_NAME">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="AGENT_STATUS" 
                                            FilterControlAltText="Filter AGENT_STATUS column" HeaderText="Status" 
                                            SortExpression="AGENT_STATUS" UniqueName="AGENT_STATUS">
                                        </telerik:GridBoundColumn>
                                       
                                         <telerik:GridBoundColumn DataField="Waiver" 
                                            FilterControlAltText="Filter Waiver column" HeaderText="Waiver" 
                                            SortExpression="Waiver" UniqueName="Waiver">
                                        </telerik:GridBoundColumn>
                                             <telerik:GridBoundColumn DataField="RETAIL_RM" 
                                            FilterControlAltText="Filter RETAIL_RM column" HeaderText="Retail_RE" 
                                            SortExpression="RETAIL_RM" UniqueName="RETAIL_RM">
                                        </telerik:GridBoundColumn>
                                              <telerik:GridBoundColumn DataField="CORPORATE_RM" 
                                            FilterControlAltText="Filter CORPORATE_RM column" HeaderText="Corporate_RM" 
                                            SortExpression="CORPORATE_RM" UniqueName="CORPORATE_RM">
                                        </telerik:GridBoundColumn>
                                    </Columns>
                                    <EditFormSettings>
                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                        </EditColumn>
                                    </EditFormSettings>
                                </MasterTableView>
                                <FilterMenu EnableImageSprites="False">
                                </FilterMenu>
                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                </HeaderContextMenu>
                            </telerik:RadGrid>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3">
                        <telerik:RadTabStrip ID="RadTabStrip1" runat="server" 
                            MultiPageID="RadMultiPage1" Skin="Web20" Width="1120px">
                            <Tabs>
                                <telerik:RadTab runat="server" PageViewID="V1" Text="Personal Details">
                                </telerik:RadTab>
                                <telerik:RadTab runat="server" PageViewID="V2" Text="Contract/IRA">
                                </telerik:RadTab>
                                <telerik:RadTab runat="server" Owner="RadTabStrip1" PageViewID="V4" 
                                    Text="Directors">
                                </telerik:RadTab>
                                <telerik:RadTab runat="server" PageViewID="V3" Text="Other Names">
                                </telerik:RadTab>
                            </Tabs>
                        </telerik:RadTabStrip>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3">
                        <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="1121px">
                            <telerik:RadPageView ID="V1" runat="server" Selected="True">
                                <asp:Panel ID="Panel9" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                    Height="100%" style="font-weight: 700" Width="1090px">
                                    <table style="width: 97%">
                                        <tr>
                                            <td bgcolor="#666666" colspan="5" style="height: 25px;">
                                                <asp:Label ID="Label173" runat="server" style="font-weight: 700" 
                                                    Text="Personal Details"></asp:Label>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px; height: 25px;">
                                                &nbsp;</td>
                                            <td style="width: 389px; height: 25px;">
                                                <asp:Label ID="Label148" runat="server" style="font-weight: 700" 
                                                    Text="App Number"></asp:Label>
                                            </td>
                                            <td style="width: 774px; height: 25px;">
                                                <asp:Label ID="lblfile" runat="server" Font-Size="Small" ForeColor="Red" 
                                                    style="font-weight: 700"></asp:Label>
                                            </td>
                                            <td class="style8" style="width: 410px; height: 25px;">
                                            </td>
                                            <td style="width: 287px; height: 25px;">
                                                &nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px">
                                                <asp:Label ID="Label102" runat="server" Text="Receive Date"></asp:Label>
                                            </td>
                                            <td style="width: 774px">
                                                <telerik:RadDatePicker ID="dtreceive" Runat="server" MinDate="" Skin="Sunset">
                                                    <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                    </Calendar>
                                                    <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                    </DateInput>
                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                </telerik:RadDatePicker>
                                            </td>
                                            <td class="style8" style="width: 410px">
                                                <asp:Label ID="Label199" runat="server" Text=" Agent No"></asp:Label>
                                            </td>
                                            <td style="width: 287px">
                                                <telerik:RadTextBox ID="txtagentno" Runat="server" Enabled="False" 
                                                    Skin="Sunset" Width="200px">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px">
                                                <asp:Label ID="Label126" runat="server" Text="Intermediary Name"></asp:Label>
                                            </td>
                                            <td style="width: 774px">
                                                <telerik:RadTextBox ID="txtname" Runat="server" Skin="Sunset" Width="350px">
                                                </telerik:RadTextBox>
                                            </td>
                                            <td class="style8" style="width: 410px">
                                                <asp:Label ID="Label132" runat="server" Text="Agent Type"></asp:Label>
                                            </td>
                                            <td style="width: 287px">
                                                <telerik:RadComboBox ID="cbotype" Runat="server" AutoPostBack="True" 
                                                    Skin="Simple" Width="200px">
                                                </telerik:RadComboBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px">
                                                <asp:Label ID="Label168" runat="server" Text="Region Name"></asp:Label>
                                            </td>
                                            <td style="width: 774px">
                                                <telerik:RadComboBox ID="cboregion" Runat="server" AutoPostBack="True" 
                                                    Skin="Simple" Width="200px">
                                                    <Items>
                                                        <telerik:RadComboBoxItem runat="server" Owner="cboregion" Text="0" Value="0" />
                                                        <telerik:RadComboBoxItem runat="server" Owner="cboregion" Text="15%" 
                                                            Value="0.15" />
                                                    </Items>
                                                </telerik:RadComboBox>
                                            </td>
                                            <td class="style8" style="width: 410px">
                                                <asp:Label ID="Label167" runat="server" Text="Sales Manager"></asp:Label>
                                            </td>
                                            <td style="width: 287px">
                                                <telerik:RadComboBox ID="cbosalesMgr" Runat="server" AutoPostBack="True" 
                                                    Skin="Simple" Width="250px">
                                                    <Items>
                                                        <telerik:RadComboBoxItem runat="server" Owner="cbosalesMgr" Text="0" 
                                                            Value="0" />
                                                        <telerik:RadComboBoxItem runat="server" Owner="cbosalesMgr" Text="15%" 
                                                            Value="0.15" />
                                                    </Items>
                                                </telerik:RadComboBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px">
                                                <asp:Label ID="Label169" runat="server" Text="Pin No"></asp:Label>
                                            </td>
                                            <td style="width: 774px">
                                                <telerik:RadTextBox ID="txtpin" Runat="server" Skin="Sunset" Width="250px">
                                                </telerik:RadTextBox>
                                            </td>
                                            <td class="style8" style="width: 410px">
                                                <asp:Label ID="Label170" runat="server" Text="ID No/Reg No"></asp:Label>
                                            </td>
                                            <td style="width: 287px">
                                                <telerik:RadTextBox ID="txtid" Runat="server" Skin="Sunset" Width="200px">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px">
                                                <asp:Label ID="Label197" runat="server" Text="Contract Date"></asp:Label>
                                            </td>
                                            <td style="width: 774px">
                                                <telerik:RadDatePicker ID="dtcontract" Runat="server" MinDate="" Skin="Sunset">
                                                    <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                    </Calendar>
                                                    <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                    </DateInput>
                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                </telerik:RadDatePicker>
                                            </td>
                                            <td class="style8" style="width: 410px">
                                                <asp:Label ID="Label189" runat="server" Text="PayRoll No"></asp:Label>
                                            </td>
                                            <td style="width: 287px">
                                                <telerik:RadTextBox ID="txtPayroll" Runat="server" Enabled="False" 
                                                    Skin="Sunset" Width="200px">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td bgcolor="#666666" colspan="5">
                                                <asp:Label ID="Label155" runat="server" style="font-weight: 700" 
                                                    Text="Contact Details"></asp:Label>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px">
                                                <asp:Label ID="Label166" runat="server" Text="Pri Mobile No"></asp:Label>
                                            </td>
                                            <td style="width: 774px">
                                                <telerik:RadTextBox ID="txtMobile" Runat="server" Skin="Sunset" Width="200px">
                                                </telerik:RadTextBox>
                                            </td>
                                            <td class="style8" style="width: 410px">
                                                <asp:Label ID="Label172" runat="server" Text="Sec Mobile No"></asp:Label>
                                            </td>
                                            <td style="width: 287px">
                                                <telerik:RadTextBox ID="txtMobile2" Runat="server" Skin="Sunset" Width="200px">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px">
                                                <asp:Label ID="Label171" runat="server" Text="Email"></asp:Label>
                                            </td>
                                            <td style="width: 774px">
                                                <telerik:RadTextBox ID="txtemail" Runat="server" Skin="Sunset" Width="250px">
                                                </telerik:RadTextBox>
                                            </td>
                                            <td class="style8" style="width: 410px">
                                                &nbsp;</td>
                                            <td style="width: 287px">
                                                &nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td bgcolor="#666666" colspan="5">
                                                <asp:Label ID="Label187" runat="server" style="font-weight: 700" 
                                                    Text="Commission Details"></asp:Label>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px; height: 11px;">
                                                &nbsp;</td>
                                            <td style="width: 389px; height: 11px;">
                                                <asp:Label ID="Label186" runat="server" Text="Commission Rate"></asp:Label>
                                            </td>
                                            <td style="width: 774px; height: 11px;">
                                                <telerik:RadNumericTextBox ID="txtrate" Runat="server" Culture="en-US" 
                                                    Value="0.1" Width="125px" Skin="Simple">
                                                </telerik:RadNumericTextBox>
                                            </td>
                                            <td class="style8" style="width: 410px; height: 11px;">
                                                <asp:Label ID="Label188" runat="server" Text="Pay Frequency"></asp:Label>
                                            </td>
                                            <td style="width: 287px; height: 11px;">
                                                <telerik:RadComboBox ID="cbofreq" Runat="server" AutoPostBack="True" 
                                                    Skin="Simple">
                                                    <Items>
                                                        <telerik:RadComboBoxItem runat="server" Owner="cbofreq" Text="Daily" 
                                                            Value="1" />
                                                        <telerik:RadComboBoxItem runat="server" Owner="cbofreq" Text="Weekly" 
                                                            Value="7" />
                                                        <telerik:RadComboBoxItem runat="server" Text="Bi-Weekly" Value="14" />
                                                        <telerik:RadComboBoxItem runat="server" Text="Monthly" Value="30" />
                                                    </Items>
                                                </telerik:RadComboBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="height: 11px;" colspan="5">
                                                <hr />
                                            </td>
                                        </tr>
                                    </table>
                                </asp:Panel>
                            </telerik:RadPageView>
                             <telerik:RadPageView ID="V2" runat="server">
                                 <asp:Panel ID="Panel4" runat="server" BorderStyle="Solid" BorderWidth="1px">
                                     <table style="width: 100%">
                                         <tr>
                                             <td bgcolor="#666666" style="height: 13px">
                                                 <asp:Label ID="Label7" runat="server" Font-Bold="True" 
                                                     Text="IRA/Contract Details"></asp:Label>
                                             </td>
                                         </tr>
                                         <tr>
                                             <td class="style8">
                                                 <asp:Panel ID="Panel37" runat="server" Height="100%" ScrollBars="Both" 
                                                     Width="100%">
                                                     <telerik:RadGrid ID="GD_CONTRACT" runat="server" AllowPaging="True" 
                                                         CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                         <MasterTableView AutoGenerateColumns="False">
                                                             <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                             <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                 <HeaderStyle Width="20px" />
                                                             </RowIndicatorColumn>
                                                             <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                 <HeaderStyle Width="20px" />
                                                             </ExpandCollapseColumn>
                                                             <Columns>
                                                         
                                                                 <telerik:GridBoundColumn DataField="ID" FilterControlAltText="Filter ID column" 
                                                                     HeaderText="ID" SortExpression="ID" UniqueName="ID">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="REF_NO" 
                                                                     FilterControlAltText="Filter REF_NO column" HeaderText="Ref_No" 
                                                                     SortExpression="REF_NO" UniqueName="REF_NO">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Licence_No" 
                                                                     FilterControlAltText="Filter Licence_No column" HeaderText="Licence_No" 
                                                                     SortExpression="Licence_No" UniqueName="Licence_No">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Valid_From" 
                                                                     FilterControlAltText="Filter Valid_From column" HeaderText="Valid_From" 
                                                                     ItemStyle-Wrap="False" SortExpression="Valid_From" UniqueName="Valid_From">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Valid_To" 
                                                                     FilterControlAltText="Filter Valid_To column" HeaderText="Valid_To" 
                                                                     SortExpression="Valid_To" UniqueName="Valid_To">
                                                                 </telerik:GridBoundColumn>
                                                                  <telerik:GridBoundColumn DataField="Status" 
                                                                     FilterControlAltText="Filter Status column" HeaderText="Status" 
                                                                     SortExpression="Status" UniqueName="Status">
                                                                 </telerik:GridBoundColumn>
                                                             </Columns>
                                                             <EditFormSettings>
                                                                 <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                 </EditColumn>
                                                             </EditFormSettings>
                                                         </MasterTableView>
                                                         <FilterMenu EnableImageSprites="False">
                                                         </FilterMenu>
                                                         <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                         </HeaderContextMenu>
                                                     </telerik:RadGrid>
                                                 </asp:Panel>
                                             </td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; ">
                                                 &nbsp;</td>
                                         </tr>
                                     </table>
                                 </asp:Panel>
                            </telerik:RadPageView>
                              <telerik:RadPageView ID="V4" runat="server">
                                 <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px">
                                     <table style="width: 100%">
                                         <tr>
                                             <td bgcolor="#666666" style="height: 13px">
                                                 <asp:Label ID="Label1" runat="server" Font-Bold="True" Text="Directors"></asp:Label>
                                             </td>
                                         </tr>
                                         <tr>
                                             <td class="style8">
                                                 <asp:Panel ID="Panel3" runat="server" Height="100%" ScrollBars="Both" 
                                                     Width="100%">
                                                     <telerik:RadGrid ID="GD_DIRE" runat="server" AllowPaging="True" CellSpacing="0" 
                                                         GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                         <MasterTableView AutoGenerateColumns="False" DataKeyNames="ID">
                                                             <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                             <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                 <HeaderStyle Width="20px" />
                                                             </RowIndicatorColumn>
                                                             <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                 <HeaderStyle Width="20px" />
                                                             </ExpandCollapseColumn>
                                                             <Columns>
                                                                
                                                                 <telerik:GridBoundColumn DataField="ID" FilterControlAltText="Filter ID column" 
                                                                     HeaderText="ID" SortExpression="ID" UniqueName="ID">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="NAME" 
                                                                     FilterControlAltText="Filter NAME column" HeaderText="Full_Name" 
                                                                     SortExpression="NAME" UniqueName="NAME">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="NID_NO" 
                                                                     FilterControlAltText="Filter NID_NO column" HeaderText="ID_No" 
                                                                     SortExpression="NID_NO" UniqueName="NID_NO">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Mobile_No" 
                                                                     FilterControlAltText="Filter Mobile_No column" HeaderText="Mobile_No" 
                                                                     ItemStyle-Wrap="False" SortExpression="Mobile_No" UniqueName="Mobile_No">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Email" 
                                                                     FilterControlAltText="Filter Email column" HeaderText="Email" 
                                                                     SortExpression="Email" UniqueName="Email">
                                                                 </telerik:GridBoundColumn>
                                                             </Columns>
                                                             <EditFormSettings>
                                                                 <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                 </EditColumn>
                                                             </EditFormSettings>
                                                         </MasterTableView>
                                                         <FilterMenu EnableImageSprites="False">
                                                         </FilterMenu>
                                                         <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                         </HeaderContextMenu>
                                                     </telerik:RadGrid>
                                                 </asp:Panel>
                                             </td>
                                         </tr>
                                     </table>
                                 </asp:Panel>
                            </telerik:RadPageView>
                             <telerik:RadPageView ID="V3" runat="server">
                                 <asp:Panel ID="Panel5" runat="server" BorderStyle="Solid" BorderWidth="1px">
                                     <table style="width: 100%">
                                         <tr>
                                             <td bgcolor="#666666" style="height: 13px">
                                                 <asp:Label ID="Label2" runat="server" Font-Bold="True" Text="Other Names"></asp:Label>
                                             </td>
                                         </tr>
                                         <tr>
                                             <td class="style8">
                                                 <asp:Panel ID="Panel6" runat="server" Height="100%" ScrollBars="Both" 
                                                     Width="100%">
                                                     <telerik:RadGrid ID="GD_VIEW" runat="server" AllowPaging="True" CellSpacing="0" 
                                                         GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                         <MasterTableView AutoGenerateColumns="False" DataKeyNames="ID">
                                                             <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                             <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                 <HeaderStyle Width="20px" />
                                                             </RowIndicatorColumn>
                                                             <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                 <HeaderStyle Width="20px" />
                                                             </ExpandCollapseColumn>
                                                             <Columns>
                                                                
                                                                 <telerik:GridBoundColumn DataField="ID" FilterControlAltText="Filter ID column" 
                                                                     HeaderText="ID" SortExpression="ID" UniqueName="ID">
                                                                 </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="REF_NO" 
                                                                     FilterControlAltText="Filter REF_NO column" HeaderText="Ref_No" 
                                                                     SortExpression="REF_NO" UniqueName="REF_NO">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="NAME" 
                                                                     FilterControlAltText="Filter NAME column" HeaderText="Full_Name" 
                                                                     SortExpression="NAME" UniqueName="NAME">
                                                                 </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Entry_Date" 
                                                                     FilterControlAltText="Filter Entry_Date column" HeaderText="Entry_Date" 
                                                                     SortExpression="Entry_Date" UniqueName="Entry_Date">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Entry_By" 
                                                                     FilterControlAltText="Filter Entry_By column" HeaderText="Entry_By" 
                                                                     SortExpression="Entry_By" UniqueName="Entry_By">
                                                                 </telerik:GridBoundColumn>
                                                             </Columns>
                                                             <EditFormSettings>
                                                                 <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                 </EditColumn>
                                                             </EditFormSettings>
                                                         </MasterTableView>
                                                         <FilterMenu EnableImageSprites="False">
                                                         </FilterMenu>
                                                         <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                         </HeaderContextMenu>
                                                     </telerik:RadGrid>
                                                 </asp:Panel>
                                             </td>
                                         </tr>
                                     </table>
                                 </asp:Panel>
                            </telerik:RadPageView>
                        </telerik:RadMultiPage>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3">
                        <asp:Panel ID="Panel35" runat="server" BorderColor="#000001" 
                            BorderStyle="Solid" BorderWidth="1px" Width="1116px">
                            <table style="width: 100%">
                                <tr>
                                    <td bgcolor="#666666" colspan="2">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="width: 117px">
                                        <asp:Label ID="Label121" runat="server" style="font-weight: 700" 
                                            Text="Comments"></asp:Label>
                                    </td>
                                    <td>
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td colspan="2">
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="100%">
                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridBoundColumn DataField="Note_date" 
                                                            FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                            ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Ref_No" 
                                                            FilterControlAltText="Filter Ref_No column" HeaderText="Ref_No" 
                                                            ItemStyle-Width="50" SortExpression="Ref_No" UniqueName="Ref_No">
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Note_From" 
                                                            FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                            ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Notes" 
                                                            FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                            SortExpression="Notes" UniqueName="Notes">
                                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <ItemStyle Wrap="False" />
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td colspan="4">
                        &nbsp;</td>
                </tr>
                <tr>
                    <td style="width: 105px">
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                </tr>
            </table>
        </ContentTemplate>
    
    </asp:UpdatePanel>
</asp:Content>


