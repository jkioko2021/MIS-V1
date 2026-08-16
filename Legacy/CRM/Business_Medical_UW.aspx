<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Medical_UW.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                    
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                      <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" Width="1170px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="Medical Underwriting" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td style="width: 1025px" align="right">
                                                    <asp:Label ID="Label141" runat="server" Text="Search by"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    <telerik:RadComboBox ID="cbosearch" Runat="server" MarkFirstMatch="True" 
                                                        Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Text="Proposer Name" Value="P" />
                                                            <telerik:RadComboBoxItem runat="server" Text="File No." Value="F" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 264px">
                                                    <telerik:RadTextBox ID="txtsearch" Runat="server" Skin="Web20" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Text="Search" Skin="Simple">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel11" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTracking" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Web20" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                        UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                        <telerik:GridBoundColumn DataField="Receive_dt" 
                                                                        FilterControlAltText="Filter Receive_dt column" HeaderText="Receive_dt" 
                                                                        SortExpression="Receive_dt" UniqueName="Receive_dt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                        FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                        SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>   
                                                                    <telerik:GridBoundColumn DataField="Business_Type" 
                                                                        FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                        SortExpression="Business_Type" UniqueName="Business_Type">
                                                                    </telerik:GridBoundColumn>                                                   
                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                        FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                        SortExpression="File_Status" UniqueName="File_Status">
                                                                    </telerik:GridBoundColumn>
                                                                         <telerik:GridBoundColumn DataField="Product" 
                                                                        FilterControlAltText="Filter Product column" HeaderText="Product" 
                                                                        SortExpression="Product" UniqueName="Product">
                                                                    </telerik:GridBoundColumn>
                                                                           <telerik:GridBoundColumn DataField="Syst" 
                                                                        FilterControlAltText="Filter Syst column" HeaderText="System" 
                                                                        SortExpression="Syst" UniqueName="Syst">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Entered_By" 
                                                                        FilterControlAltText="Filter Entered_By column" HeaderText="Entered_By" 
                                                                        SortExpression="Entered_By" UniqueName="Entered_By">
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
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <telerik:RadTabStrip ID="RadTabStrip1" runat="server" 
                                            MultiPageID="RadMultiPage1" SelectedIndex="0" Skin="Web20" Width="100%">
                                            <Tabs>
                                                <telerik:RadTab runat="server" Text="Register" Selected="True" 
                                                    SelectedIndex="0">
                                                </telerik:RadTab>
                                                <telerik:RadTab runat="server" PageViewID="V2" Text="Documentation">
                                                </telerik:RadTab>
                                                <telerik:RadTab runat="server" PageViewID="V3" Text="HPC Update">
                                                </telerik:RadTab>
                                            </Tabs>
                                        </telerik:RadTabStrip>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="1100px">
                                            <telerik:RadPageView ID="V1" runat="server" Selected="True">
                                                <asp:Panel ID="Panel29" runat="server">
                                                    <table style="width: 100%">
                                                        <tr>
                                                            <td bgcolor="#999999" colspan="4">
                                                                <asp:Label ID="Label148" runat="server" Text="Details"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 158px">
                                                                <asp:Label ID="Label32" runat="server" Text="Receive Date"></asp:Label>
                                                            </td>
                                                            <td style="width: 172px">
                                                                <telerik:RadDatePicker ID="dtreceivedate" Runat="server" Enabled="False" 
                                                                    MinDate="" Skin="Web20">
                                                                    <Calendar Skin="Web20" UseColumnHeadersAsSelectors="False" 
                                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                    </Calendar>
                                                                    <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                    </DateInput>
                                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                </telerik:RadDatePicker>
                                                            </td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 158px">
                                                                <asp:Label ID="Label149" runat="server" Text="Client Type"></asp:Label>
                                                            </td>
                                                            <td style="width: 172px">
                                                                <telerik:RadComboBox ID="cboclient" Runat="server" Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboclient" Text="Retail" 
                                                                            Value="R" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboclient" Text="SME" 
                                                                            Value="S" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboclient" Text="Corporate" 
                                                                            Value="C" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 158px">
                                                                <asp:Label ID="Label10" runat="server" Text="Business Type"></asp:Label>
                                                            </td>
                                                            <td style="width: 172px">
                                                                <telerik:RadComboBox ID="cboBusiness" Runat="server" AllowCustomText="True" 
                                                                    AutoPostBack="True" MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="New" 
                                                                            Value="N" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Renewal" 
                                                                            Value="R" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Addon" Value="N" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 158px">
                                                                <asp:Label ID="Label30" runat="server" Text="Proposer Name"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadTextBox ID="txtProposer" Runat="server" Skin="Web20" Width="250px">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 158px">
                                                                <asp:Label ID="Label142" runat="server" Text="Family Code"></asp:Label>
                                                            </td>
                                                            <td style="width: 172px">
                                                                <telerik:RadTextBox ID="txtFamily" Runat="server" Skin="Web20" Width="150px">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 158px">
                                                                <asp:Label ID="Label14" runat="server" Text="Agent/Broker"></asp:Label>
                                                            </td>
                                                            <td style="width: 172px">
                                                                <telerik:RadComboBox ID="cboagent" Runat="server" AccessibilityMode="True" 
                                                                    AllowCustomText="True" MarkFirstMatch="True" Skin="Web20" Width="300px">
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 158px">
                                                                &nbsp;</td>
                                                            <td>
                                                                <asp:CheckBox ID="chkmtiba" runat="server" Text="Is Mtiba" />
                                                            </td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 158px">
                                                                <asp:Label ID="Label13" runat="server" Text="Premium Amt"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadNumericTextBox ID="txtpremium" Runat="server" Culture="en-US" 
                                                                    Skin="Web20" Value="0" Width="200px">
                                                                </telerik:RadNumericTextBox>
                                                            </td>
                                                            <td style="width: 155px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="4">
                                                                <hr style="width: 1128px" />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="4">
                                                                &nbsp;</td>
                                                        </tr>
                                                    </table>
                                                </asp:Panel>
                                            </telerik:RadPageView>
                                                 <telerik:RadPageView ID="V2" runat="server" Width="1144px">
                                                     <asp:Panel ID="Panel2" runat="server">
                                                         <table style="width: 99%">
                                                             <tr>
                                                                 <td>
                                                                     <asp:Label ID="Label147" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                                 </td>
                                                             </tr>
                                                             <tr>
                                                                 <td>
                                                                     <asp:Panel ID="Panel30" runat="server" Height="100%" ScrollBars="Both" 
                                                                         Width="1100px">
                                                                         <telerik:RadGrid ID="GD_DOCS" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                             GridLines="None" Height="100%" Skin="Web20" Width="100%">
                                                                             <MasterTableView AutoGenerateColumns="False" DataKeyNames="DOC_ID">
                                                                                 <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                 <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                     <HeaderStyle Width="20px" />
                                                                                 </RowIndicatorColumn>
                                                                                 <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                     <HeaderStyle Width="20px" />
                                                                                 </ExpandCollapseColumn>
                                                                                 <Columns>
                                                                                     <telerik:GridBoundColumn DataField="DOC_ID" 
                                                                                         FilterControlAltText="Filter DOC_ID column" HeaderText="DOC_ID" 
                                                                                         SortExpression="DOC_ID" UniqueName="DOC_ID">
                                                                                     </telerik:GridBoundColumn>
                                                                                     <telerik:GridBoundColumn DataField="File_No" 
                                                                                         FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                                         SortExpression="File_No" UniqueName="File_No">
                                                                                     </telerik:GridBoundColumn>
                                                                                     <telerik:GridBoundColumn DataField="Doc_Title" 
                                                                                         FilterControlAltText="Filter Doc_Title column" HeaderText="Doc_Title" 
                                                                                         SortExpression="Doc_Title" UniqueName="Doc_Title">
                                                                                     </telerik:GridBoundColumn>
                                                                                     <telerik:GridBoundColumn DataField="Doc_Date" 
                                                                                         FilterControlAltText="Filter Doc_Date column" HeaderText="Doc_Date" 
                                                                                         SortExpression="Doc_Date" UniqueName="Doc_Date">
                                                                                     </telerik:GridBoundColumn>
                                                                                     <telerik:GridBoundColumn DataField="File_Name" 
                                                                                         FilterControlAltText="Filter File_Name column" HeaderText="File_Name" 
                                                                                         SortExpression="File_Name" UniqueName="File_Name">
                                                                                     </telerik:GridBoundColumn>
                                                                                     <telerik:GridBoundColumn DataField="Upload_By" 
                                                                                         FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                                         SortExpression="Upload_By" UniqueName="Upload_By">
                                                                                     </telerik:GridBoundColumn>
                                                                                     <telerik:GridTemplateColumn AllowFiltering="false" HeaderText="View" 
                                                                                         SortExpression="DOC_ID">
                                                                                         <ItemTemplate>
                                                                                             <asp:LinkButton ID="lnkDownload" runat="server" 
                                                                                                 CommandArgument='<%# Eval("DOC_ID") %>' OnClick="DownloadFile" Text="Download"></asp:LinkButton>
                                                                                         </ItemTemplate>
                                                                                     </telerik:GridTemplateColumn>
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
                                                                 <td>
                                                                     <asp:Panel ID="Panel13" runat="server" BorderStyle="Solid" Height="100%" 
                                                                         ScrollBars="Horizontal" Width="1071px">
                                                                         <asp:Literal ID="ltEmbed" runat="server" />
                                                                     </asp:Panel>
                                                                 </td>
                                                             </tr>
                                                             <tr>
                                                                 <td style="height: 17px;">
                                                                     &nbsp;</td>
                                                             </tr>
                                                             <tr>
                                                                 <td style="height: 17px;">
                                                                 </td>
                                                             </tr>
                                                             <tr>
                                                                 <td style="height: 17px;">
                                                                     <asp:Panel ID="Panel33" runat="server">
                                                                         <table style="width: 100%">
                                                                             <tr>
                                                                                 <td style="width: 193px">
                                                                                     <asp:Label ID="Label177" runat="server" Text="Invoice/Credit Note"></asp:Label>
                                                                                 </td>
                                                                                 <td style="width: 246px">
                                                                                     <telerik:RadComboBox ID="cbodoc" Runat="server" MarkFirstMatch="True" 
                                                                                         Skin="Web20" Width="250px">
                                                                                     </telerik:RadComboBox>
                                                                                 </td>
                                                                                 <td>
                                                                                     <asp:Label ID="Label178" runat="server" Text="Invoice/Cr No"></asp:Label>
                                                                                 </td>
                                                                                 <td>
                                                                                     <telerik:RadTextBox ID="txtinv" Runat="server" Skin="Web20" Width="250px">
                                                                                     </telerik:RadTextBox>
                                                                                 </td>
                                                                             </tr>
                                                                             <tr>
                                                                                 <td style="width: 193px">
                                                                                     &nbsp;</td>
                                                                                 <td style="width: 246px">
                                                                                     <asp:FileUpload ID="FL1" runat="server" Width="330px" />
                                                                                 </td>
                                                                                 <td>
                                                                                     <asp:Label ID="Label157" runat="server" Text="Amount"></asp:Label>
                                                                                 </td>
                                                                                 <td>
                                                                                     <telerik:RadNumericTextBox ID="txtamount" Runat="server" Culture="en-US" 
                                                                                         Skin="Web20" Value="0" Width="200px">
                                                                                     </telerik:RadNumericTextBox>
                                                                                 </td>
                                                                             </tr>
                                                                             <tr>
                                                                                 <td style="width: 193px">
                                                                                     &nbsp;</td>
                                                                                 <td style="width: 246px">
                                                                                     <telerik:RadButton ID="btnupload" runat="server" Skin="Simple" Text="Upload">
                                                                                     </telerik:RadButton>
                                                                                     <asp:Label ID="lblupload" runat="server" Font-Size="Medium"></asp:Label>
                                                                                 </td>
                                                                                 <td>
                                                                                     <asp:Label ID="Label179" runat="server" Text="Policy Code"></asp:Label>
                                                                                 </td>
                                                                                 <td>
                                                                                     <telerik:RadTextBox ID="txtpolicy" Runat="server" Skin="Web20" Width="250px">
                                                                                     </telerik:RadTextBox>
                                                                                 </td>
                                                                             </tr>
                                                                             <tr>
                                                                                 <td bgcolor="#666666" colspan="4">
                                                                                     &nbsp;</td>
                                                                             </tr>
                                                                             <tr>
                                                                                 <td style="width: 193px">
                                                                                     <asp:Label ID="Label176" runat="server" Text="Payment"></asp:Label>
                                                                                 </td>
                                                                                 <td style="width: 246px">
                                                                                     <telerik:RadComboBox ID="cbopayment" Runat="server" MarkFirstMatch="True" 
                                                                                         Skin="Web20" Width="190px">
                                                                                         <Items>
                                                                                             <telerik:RadComboBoxItem runat="server" Owner="cbopayment" Text="FULL-PAID" 
                                                                                                 Value="FULL-PAID" />
                                                                                             <telerik:RadComboBoxItem runat="server" Owner="cbopayment" Text="PART-PAID" 
                                                                                                 Value="PART-PAID" />
                                                                                             <telerik:RadComboBoxItem runat="server" Owner="cbopayment" Text="NOT-PAID" 
                                                                                                 Value="NOT-PAID" />
                                                                                             <telerik:RadComboBoxItem runat="server" Text="CREDIT NOTE" Value="CR" />
                                                                                         </Items>
                                                                                     </telerik:RadComboBox>
                                                                                 </td>
                                                                                 <td>
                                                                                     &nbsp;</td>
                                                                                 <td>
                                                                                     &nbsp;</td>
                                                                             </tr>
                                                                             <tr>
                                                                                 <td style="width: 193px">
                                                                                     <asp:Label ID="Label153" runat="server" Text="Action"></asp:Label>
                                                                                 </td>
                                                                                 <td style="width: 246px">
                                                                                     <telerik:RadComboBox ID="cboAction" Runat="server" AllowCustomText="True" 
                                                                                         AutoPostBack="True" MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                                                         <Items>
                                                                                             <telerik:RadComboBoxItem runat="server" Owner="cboAction" />
                                                                                             <telerik:RadComboBoxItem runat="server" Owner="cboAction" Text="Cashier" 
                                                                                                 Value="C" />
                                                                                             <telerik:RadComboBoxItem runat="server" Text="Forward" Value="F" />
                                                                                             <telerik:RadComboBoxItem runat="server" Owner="cboAction" 
                                                                                                 Text="Return-Incomplete" Value="RI" />
                                                                                             <telerik:RadComboBoxItem runat="server" Owner="cboAction" Text="Hold" 
                                                                                                 Value="H" />
                                                                                             <telerik:RadComboBoxItem runat="server" Owner="cboAction" Text="Decline" 
                                                                                                 Value="D" />
                                                                                         </Items>
                                                                                     </telerik:RadComboBox>
                                                                                 </td>
                                                                                 <td>
                                                                                     <asp:CheckBox ID="chkrevert" runat="server" Text="HPC" />
                                                                                     &nbsp;
                                                                                 </td>
                                                                                 <td>
                                                                                     <asp:CheckBox ID="chkwaiver" runat="server" 
                                                                                         Text="New Waiver-Lateral Movement" />
                                                                                 </td>
                                                                             </tr>
                                                                             <tr>
                                                                                 <td style="width: 193px">
                                                                                     <asp:Label ID="Label154" runat="server" Text="Entered By"></asp:Label>
                                                                                 </td>
                                                                                 <td style="width: 246px">
                                                                                     <asp:Label ID="lblenteredby" runat="server"></asp:Label>
                                                                                 </td>
                                                                                 <td colspan="2">
                                                                                     <asp:Label ID="allocatedto" runat="server"></asp:Label>
                                                                                 </td>
                                                                             </tr>
                                                                             <tr>
                                                                                 <td style="width: 193px">
                                                                                     <asp:Label ID="Label155" runat="server" Text="Notes"></asp:Label>
                                                                                 </td>
                                                                                 <td rowspan="2">
                                                                                     <telerik:RadTextBox ID="txtcomment" Runat="server" Height="50px" Skin="Web20" 
                                                                                         TextMode="MultiLine" Width="450px">
                                                                                     </telerik:RadTextBox>
                                                                                 </td>
                                                                                 <td colspan="2">
                                                                                     &nbsp;</td>
                                                                             </tr>
                                                                             <tr>
                                                                                 <td style="width: 193px">
                                                                                     &nbsp;</td>
                                                                                 <td colspan="2">
                                                                                     &nbsp;</td>
                                                                             </tr>
                                                                             <tr>
                                                                                 <td style="width: 193px; height: 38px;">
                                                                                 </td>
                                                                                 <td style="height: 38px;">
                                                                                     <telerik:RadButton ID="btnforward" runat="server" Skin="Simple" Text="Update" 
                                                                                         Width="200px">
                                                                                     </telerik:RadButton>
                                                                                 </td>
                                                                                 <td colspan="2" style="height: 38px">
                                                                                     &nbsp;</td>
                                                                             </tr>
                                                                         </table>
                                                                     </asp:Panel>
                                                                 </td>
                                                             </tr>
                                                         </table>
                                                     </asp:Panel>
                                            </telerik:RadPageView>
                                             <telerik:RadPageView ID="V3" runat="server" Width="1144px">
                                                <asp:Panel ID="Panel3" runat="server">
                                                    <table style="width: 99%">
                                                        <tr>
                                                            <td>
                                                                <asp:Label ID="Label1" runat="server" Font-Bold="True" Text="HPC"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Panel ID="Panel39" runat="server">
                                                                    <table style="width: 100%">
                                                                        <tr>
                                                                            <td style="width: 707px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 195px">
                                                                                <telerik:RadComboBox ID="cbosearch_1" Runat="server" AutoPostBack="True" 
                                                                                    MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                                                    <Items>
                                                                                        <telerik:RadComboBoxItem runat="server" Owner="cbosearch_1" Text="Member No" 
                                                                                            Value="M" />
                                                                                        <telerik:RadComboBoxItem runat="server" Owner="cbosearch_1" Text="Member Name" 
                                                                                            Value="N" />
                                                                                    </Items>
                                                                                </telerik:RadComboBox>
                                                                            </td>
                                                                            <td>
                                                                                <telerik:RadTextBox ID="txtsearch_1" Runat="server" Skin="Web20">
                                                                                </telerik:RadTextBox>
                                                                                <telerik:RadButton ID="search" runat="server" Text="Search">
                                                                                </telerik:RadButton>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </asp:Panel>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Panel ID="Panel31" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1128px">
                                                                    <telerik:RadGrid ID="GD_Revert" runat="server" AllowPaging="True" 
                                                                        CellSpacing="0" GridLines="None" Height="100%" PageSize="30" Skin="Web20" 
                                                                        Width="100%">
                                                                        <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </RowIndicatorColumn>
                                                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </ExpandCollapseColumn>
                                                                            <Columns>
                                                                                <telerik:GridButtonColumn CommandName="Select" 
                                                                                    FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                                    UniqueName="Select">
                                                                                    <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                                    <ItemStyle Width="50px" />
                                                                                </telerik:GridButtonColumn>
                                                                                <telerik:GridBoundColumn DataField="Receive_dt" 
                                                                                    FilterControlAltText="Filter Receive_dt column" HeaderText="Receive_dt" 
                                                                                    SortExpression="Receive_dt" UniqueName="Receive_dt">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="File_No" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                                    FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                                    SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Client_Type" 
                                                                                    FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                                    SortExpression="Client_Type" UniqueName="Client_Type">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Business_Type" 
                                                                                    FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                                    SortExpression="Business_Type" UniqueName="Business_Type">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="File_Status" 
                                                                                    FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                                    SortExpression="File_Status" UniqueName="File_Status">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Entered_By" 
                                                                                    FilterControlAltText="Filter Entered_By column" HeaderText="Entered_By" 
                                                                                    SortExpression="Entered_By" UniqueName="Entered_By">
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
                                                        <tr>
                                                            <td>
                                                                <asp:Panel ID="Panel34" runat="server">
                                                                    <table style="width: 100%">
                                                                        <tr>
                                                                            <td bgcolor="#999999" colspan="4">
                                                                                <asp:Label ID="Label173" runat="server" style="font-weight: 700" 
                                                                                    Text="Member Info"></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 146px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 272px">
                                                                                <asp:CheckBox ID="chkupdate" runat="server" Text=" Member Not updated" />
                                                                            </td>
                                                                            <td style="width: 131px">
                                                                                <asp:Label ID="Label171" runat="server" style="font-weight: 700" Text="STATUS"></asp:Label>
                                                                            </td>
                                                                            <td>
                                                                                <asp:Label ID="lblstatus" runat="server" Font-Size="Medium" ForeColor="Red"></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 146px">
                                                                                <asp:Label ID="Label143" runat="server" Text="Member No"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 272px">
                                                                                <telerik:RadTextBox ID="txtmemno" Runat="server" Skin="Outlook" Width="250px">
                                                                                </telerik:RadTextBox>
                                                                            </td>
                                                                            <td style="width: 131px">
                                                                                &nbsp;<asp:Label ID="Label144" runat="server" Text="Member Name"></asp:Label>
                                                                            </td>
                                                                            <td>
                                                                                <telerik:RadTextBox ID="txtname" Runat="server" Skin="Outlook" Width="250px">
                                                                                </telerik:RadTextBox>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 146px">
                                                                                <asp:Label ID="Label146" runat="server" Text="Proposer Name"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 272px">
                                                                                <telerik:RadTextBox ID="txtprop" Runat="server" Skin="Outlook" Width="250px">
                                                                                </telerik:RadTextBox>
                                                                            </td>
                                                                            <td style="width: 131px">
                                                                                <asp:Label ID="Label145" runat="server" Text="Client Type"></asp:Label>
                                                                            </td>
                                                                            <td>
                                                                                <telerik:RadComboBox ID="cboclient_1" Runat="server" Skin="Outlook">
                                                                                    <Items>
                                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboclient_1" Text="Corporate" 
                                                                                            Value="C" />
                                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboclient_1" Text="Individual" 
                                                                                            Value="I" />
                                                                                    </Items>
                                                                                </telerik:RadComboBox>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 146px">
                                                                                <asp:Label ID="Label167" runat="server" Text="Mobile No"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 272px">
                                                                                <telerik:RadTextBox ID="txtmobile" Runat="server" Skin="Outlook" Width="250px">
                                                                                </telerik:RadTextBox>
                                                                            </td>
                                                                            <td style="width: 131px">
                                                                                <asp:Label ID="Label168" runat="server" Text="Email"></asp:Label>
                                                                            </td>
                                                                            <td>
                                                                                <telerik:RadTextBox ID="txtemail" Runat="server" Skin="Outlook" Width="250px">
                                                                                </telerik:RadTextBox>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td bgcolor="#999999" colspan="4">
                                                                                <asp:Label ID="Label174" runat="server" style="font-weight: 700" 
                                                                                    Text="Case Info"></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 146px">
                                                                                <asp:Label ID="Label175" runat="server" Text="Diagnosis date"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 272px">
                                                                                <telerik:RadDatePicker ID="dtdx" Runat="server" Skin="Outlook">
                                                                                    <Calendar Skin="Outlook" UseColumnHeadersAsSelectors="False" 
                                                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                                    </Calendar>
                                                                                    <DateInput DateFormat="dd-MMM-yyyy" DisplayDateFormat="dd-MMM-yyyy">
                                                                                    </DateInput>
                                                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                                </telerik:RadDatePicker>
                                                                            </td>
                                                                            <td style="width: 131px">
                                                                                <asp:Label ID="Label150" runat="server" Text="Doctor"></asp:Label>
                                                                            </td>
                                                                            <td>
                                                                                <telerik:RadTextBox ID="txtother" Runat="server" Skin="Outlook" Width="250px">
                                                                                </telerik:RadTextBox>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 146px; height: 17px;">
                                                                                <asp:Label ID="Label158" runat="server" Text="Diagnosis"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 272px; height: 17px;">
                                                                                <telerik:RadComboBox ID="cbocomor" Runat="server" AllowCustomText="True" 
                                                                                    DropDownWidth="250px" MarkFirstMatch="True" MaxHeight="400px" Skin="Outlook" 
                                                                                    Width="250px">
                                                                                    <Items>
                                                                                        <telerik:RadComboBoxItem runat="server" Owner="cbocomor" Text="Open" 
                                                                                            Value="Open" />
                                                                                        <telerik:RadComboBoxItem runat="server" Owner="cbocomor" Text="Closed" 
                                                                                            Value="Closed" />
                                                                                    </Items>
                                                                                </telerik:RadComboBox>
                                                                            </td>
                                                                            <td style="width: 131px; height: 17px;">
                                                                                <asp:Label ID="Label172" runat="server" Text="Source"></asp:Label>
                                                                            </td>
                                                                            <td style="height: 17px">
                                                                                <telerik:RadComboBox ID="cbosrc" Runat="server" AllowCustomText="True" 
                                                                                    DropDownWidth="250px" MarkFirstMatch="True" MaxHeight="400px" Skin="Outlook" 
                                                                                    Width="250px">
                                                                                    <Items>
                                                                                        <telerik:RadComboBoxItem runat="server" Owner="cbosrc" Text="Open" 
                                                                                            Value="Open" />
                                                                                        <telerik:RadComboBoxItem runat="server" Owner="cbosrc" Text="Closed" 
                                                                                            Value="Closed" />
                                                                                    </Items>
                                                                                </telerik:RadComboBox>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 146px">
                                                                                <asp:Label ID="Label160" runat="server" Text="Followup date"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 272px">
                                                                                <telerik:RadDatePicker ID="dtafollow" Runat="server" Skin="Outlook">
                                                                                    <Calendar Skin="Outlook" UseColumnHeadersAsSelectors="False" 
                                                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                                    </Calendar>
                                                                                    <DateInput DateFormat="dd-MMM-yyyy" DisplayDateFormat="dd-MMM-yyyy">
                                                                                    </DateInput>
                                                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                                </telerik:RadDatePicker>
                                                                            </td>
                                                                            <td style="width: 131px">
                                                                                <asp:Label ID="Label156" runat="server" Text="Notes"></asp:Label>
                                                                            </td>
                                                                            <td rowspan="4">
                                                                                <telerik:RadTextBox ID="txtnotes" Runat="server" Font-Size="Large" 
                                                                                    Height="100px" Rows="3" Skin="Web20" style="font-size: medium" 
                                                                                    TextMode="MultiLine" Width="500px">
                                                                                </telerik:RadTextBox>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 146px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 272px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 131px">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 146px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 272px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 131px">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 146px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 272px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 131px">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 146px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 272px">
                                                                                <asp:Label ID="lblcode" runat="server" Font-Size="Large" ForeColor="Red"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 131px">
                                                                                &nbsp;</td>
                                                                            <td>
                                                                                <telerik:RadButton ID="cmdsave" runat="server" Height="38px" Skin="Web20" 
                                                                                    Text="Save" Width="113px">
                                                                                </telerik:RadButton>
                                                                                &nbsp;&nbsp;<asp:Label ID="lblerr0" runat="server" Font-Size="Medium" ForeColor="Red"></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td colspan="4">
                                                                                <asp:Panel ID="Panel35" runat="server" Height="100%" ScrollBars="Both" 
                                                                                    Width="1140px">
                                                                                    <telerik:RadGrid ID="GDCASE" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                                        GridLines="None" Height="100%" Skin="Outlook" Width="100%">
                                                                                        <MasterTableView AutoGenerateColumns="False">
                                                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                                <HeaderStyle Width="20px" />
                                                                                            </RowIndicatorColumn>
                                                                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                                <HeaderStyle Width="20px" />
                                                                                            </ExpandCollapseColumn>
                                                                                            <Columns>
                                                                                                <telerik:GridBoundColumn DataField="Code_Id" 
                                                                                                    FilterControlAltText="Filter Code_Id column" HeaderText="Code_Id" 
                                                                                                    SortExpression="Code_Id" UniqueName="Code_Id">
                                                                                                </telerik:GridBoundColumn>
                                                                                                <telerik:GridBoundColumn DataField="Member_No" 
                                                                                                    FilterControlAltText="Filter Member_No column" HeaderText="Member_No" 
                                                                                                    SortExpression="Member_No" UniqueName="Member_No">
                                                                                                </telerik:GridBoundColumn>
                                                                                                <telerik:GridBoundColumn DataField="Member_Name" 
                                                                                                    FilterControlAltText="Filter Member_Name column" HeaderText="Member_Name" 
                                                                                                    SortExpression="Member_Name" UniqueName="Member_Name">
                                                                                                </telerik:GridBoundColumn>
                                                                                                <telerik:GridBoundColumn DataField="Followup_Dt" 
                                                                                                    FilterControlAltText="Filter Followup_Dt column" HeaderText="Followup_Dt" 
                                                                                                    SortExpression="Followup_Dt" UniqueName="Followup_Dt">
                                                                                                </telerik:GridBoundColumn>
                                                                                                <telerik:GridBoundColumn DataField="Entered_by" 
                                                                                                    FilterControlAltText="Filter Entered_by column" HeaderText="Entered_by" 
                                                                                                    SortExpression="Entered_by" UniqueName="Entered_by">
                                                                                                </telerik:GridBoundColumn>
                                                                                                <telerik:GridBoundColumn DataField="Entry_Dt" 
                                                                                                    FilterControlAltText="Filter Entry_Dt column" HeaderText="Entry_Dt" 
                                                                                                    SortExpression="Entry_Dt" UniqueName="Entry_Dt">
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
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="height: 41px">
                                                                &nbsp;</td>
                                                        </tr>
                                                    </table>
                                                </asp:Panel>
                                            </telerik:RadPageView>
                                        </telerik:RadMultiPage>
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#666666">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="height: 34px">
                                        <asp:Label ID="lblerr" runat="server" Font-Bold="True" Font-Size="Medium" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height: 41px">
                                        &nbsp;<asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="100%">
                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" Skin="Web20" Width="100%">
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
                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                            FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                            ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
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
                                </tr>
                            </table>
   </asp:Panel>
   </div>
            </ContentTemplate>
       
            </asp:UpdatePanel>
</asp:Content>